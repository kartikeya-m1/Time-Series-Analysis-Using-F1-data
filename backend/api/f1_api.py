#!/usr/bin/env python3
"""
F1 Data API Backend using Fast-F1 Library
Provides REST API endpoints for F1 telemetry, lap times, and session data
"""

import os
import sys
import logging
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
import fastf1 as ff1
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
import warnings

# Suppress FastF1 warnings for cleaner output
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure FastF1 cache
cache_dir = os.path.join(os.path.dirname(__file__), 'fastf1_cache')
os.makedirs(cache_dir, exist_ok=True)
ff1.Cache.enable_cache(cache_dir)

# Thread pool for handling intensive data processing
executor = ThreadPoolExecutor(max_workers=4)

class F1DataProcessor:
    """Handle F1 data processing using Fast-F1"""
    
    def __init__(self):
        self.session_cache = {}
        self.telemetry_cache = {}
    
    def get_session(self, year: int, event_name: str, session_type: str):
        """Get F1 session data with caching"""
        cache_key = f"{year}_{event_name}_{session_type}"
        
        if cache_key in self.session_cache:
            logger.info(f"Returning cached session: {cache_key}")
            return self.session_cache[cache_key]
        
        try:
            logger.info(f"Loading session: {year} {event_name} {session_type}")
            session = ff1.get_session(year, event_name, session_type)
            session.load()
            
            self.session_cache[cache_key] = session
            return session
            
        except Exception as e:
            logger.error(f"Error loading session {cache_key}: {str(e)}")
            raise
    
    def get_driver_telemetry(self, session, driver_code: str, lap_type: str = 'fastest'):
        """Extract telemetry data for a specific driver"""
        try:
            if lap_type == 'fastest':
                lap = session.laps.pick_driver(driver_code).pick_fastest()
            else:
                lap_number = int(lap_type)
                lap = session.laps.pick_driver(driver_code).pick_lap(lap_number)
            
            if lap.empty:
                raise ValueError(f"No lap data found for driver {driver_code}")
            
            # Get telemetry data
            telemetry = lap.get_telemetry()
            
            # Convert to serializable format
            telemetry_data = {
                'driver': driver_code,
                'lap_time': str(lap['LapTime'].total_seconds()) if pd.notna(lap['LapTime']) else None,
                'lap_number': int(lap['LapNumber']) if pd.notna(lap['LapNumber']) else None,
                'time': telemetry['Time'].dt.total_seconds().tolist(),
                'distance': telemetry['Distance'].fillna(0).tolist(),
                'speed': telemetry['Speed'].fillna(0).tolist(),
                'throttle': telemetry['Throttle'].fillna(0).tolist(),
                'brake': telemetry['Brake'].fillna(0).tolist(),
                'gear': telemetry['nGear'].fillna(1).astype(int).tolist(),
                'rpm': telemetry['RPM'].fillna(0).tolist(),
                'drs': telemetry['DRS'].fillna(0).astype(int).tolist() if 'DRS' in telemetry.columns else [0] * len(telemetry)
            }
            
            # Calculate statistics
            stats = {
                'max_speed': float(telemetry['Speed'].max()) if not telemetry['Speed'].empty else 0,
                'avg_speed': float(telemetry['Speed'].mean()) if not telemetry['Speed'].empty else 0,
                'top_gear': int(telemetry['nGear'].max()) if not telemetry['nGear'].empty else 1,
                'max_rpm': float(telemetry['RPM'].max()) if not telemetry['RPM'].empty else 0,
                'total_distance': float(telemetry['Distance'].max()) if not telemetry['Distance'].empty else 0
            }
            
            telemetry_data['statistics'] = stats
            
            return telemetry_data
            
        except Exception as e:
            logger.error(f"Error extracting telemetry for {driver_code}: {str(e)}")
            raise

    def get_session_results(self, session):
        """Get session results and driver information"""
        try:
            results = session.results
            drivers_info = []
            
            for _, driver in results.iterrows():
                driver_info = {
                    'driver_code': driver['Abbreviation'],
                    'full_name': driver['FullName'],
                    'team': driver['TeamName'],
                    'position': int(driver['Position']) if pd.notna(driver['Position']) else None,
                    'time': str(driver['Time']) if pd.notna(driver['Time']) else None,
                    'points': float(driver['Points']) if pd.notna(driver['Points']) else 0
                }
                drivers_info.append(driver_info)
            
            return drivers_info
            
        except Exception as e:
            logger.error(f"Error extracting session results: {str(e)}")
            return []

    def get_lap_times(self, session):
        """Get all lap times for the session"""
        try:
            laps = session.laps
            lap_times = []
            
            for _, lap in laps.iterrows():
                if pd.notna(lap['LapTime']):
                    lap_data = {
                        'driver': lap['Driver'],
                        'lap_number': int(lap['LapNumber']),
                        'lap_time': lap['LapTime'].total_seconds(),
                        'lap_time_str': str(lap['LapTime']),
                        'sector_1': lap['Sector1Time'].total_seconds() if pd.notna(lap['Sector1Time']) else None,
                        'sector_2': lap['Sector2Time'].total_seconds() if pd.notna(lap['Sector2Time']) else None,
                        'sector_3': lap['Sector3Time'].total_seconds() if pd.notna(lap['Sector3Time']) else None,
                        'compound': lap['Compound'] if 'Compound' in lap and pd.notna(lap['Compound']) else 'UNKNOWN',
                        'fresh_tyre': bool(lap['FreshTyre']) if 'FreshTyre' in lap else False
                    }
                    lap_times.append(lap_data)
            
            # Sort by lap time
            lap_times.sort(key=lambda x: x['lap_time'])
            
            return lap_times
            
        except Exception as e:
            logger.error(f"Error extracting lap times: {str(e)}")
            return []

# Initialize data processor
data_processor = F1DataProcessor()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/seasons', methods=['GET'])
def get_seasons():
    """Get available F1 seasons"""
    # FastF1 supports data from 2018 onwards
    current_year = datetime.now().year
    seasons = list(range(2018, current_year + 1))
    return jsonify(seasons)

@app.route('/api/events/<int:season>', methods=['GET'])
def get_events(season):
    """Get events (races) for a specific season"""
    try:
        schedule = ff1.get_event_schedule(season)
        events = []
        
        for _, event in schedule.iterrows():
            event_data = {
                'round': int(event['RoundNumber']),
                'name': event['EventName'],
                'country': event['Country'],
                'location': event['Location'],
                'date': event['EventDate'].strftime('%Y-%m-%d') if pd.notna(event['EventDate']) else None
            }
            events.append(event_data)
        
        return jsonify(events)
        
    except Exception as e:
        logger.error(f"Error fetching events for season {season}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/<int:season>/<event_name>/<session_type>', methods=['GET'])
def get_session_data(season, event_name, session_type):
    """Get session data including drivers and results"""
    try:
        session = data_processor.get_session(season, event_name, session_type)
        drivers_info = data_processor.get_session_results(session)
        
        session_data = {
            'season': season,
            'event_name': event_name,
            'session_type': session_type,
            'date': session.date.strftime('%Y-%m-%d') if session.date else None,
            'drivers': drivers_info,
            'total_laps': int(session.total_laps) if hasattr(session, 'total_laps') else None
        }
        
        return jsonify(session_data)
        
    except Exception as e:
        logger.error(f"Error fetching session data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/telemetry/<int:season>/<event_name>/<session_type>/<driver_code>/<lap_type>', methods=['GET'])
def get_telemetry_data(season, event_name, session_type, driver_code, lap_type):
    """Get telemetry data for a specific driver and lap"""
    try:
        session = data_processor.get_session(season, event_name, session_type)
        telemetry_data = data_processor.get_driver_telemetry(session, driver_code, lap_type)
        
        # Add track information
        telemetry_data['track_info'] = {
            'name': event_name,
            'country': session.event.get('Country', 'Unknown'),
            'length': float(session.event.get('Circuit', {}).get('Length', 0)) if hasattr(session, 'event') else 0
        }
        
        return jsonify(telemetry_data)
        
    except Exception as e:
        logger.error(f"Error fetching telemetry data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/laptimes/<int:season>/<event_name>/<session_type>', methods=['GET'])
def get_lap_times(season, event_name, session_type):
    """Get lap times for all drivers in a session"""
    try:
        session = data_processor.get_session(season, event_name, session_type)
        lap_times = data_processor.get_lap_times(session)
        
        return jsonify({
            'session_info': {
                'season': season,
                'event_name': event_name,
                'session_type': session_type
            },
            'lap_times': lap_times
        })
        
    except Exception as e:
        logger.error(f"Error fetching lap times: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/compare/<int:season>/<event_name>/<session_type>', methods=['POST'])
def compare_drivers():
    """Compare telemetry data between multiple drivers"""
    try:
        data = request.get_json()
        drivers = data.get('drivers', [])
        lap_type = data.get('lap_type', 'fastest')
        
        if not drivers:
            return jsonify({'error': 'No drivers specified'}), 400
        
        session = data_processor.get_session(season, event_name, session_type)
        comparison_data = {
            'drivers': [],
            'session_info': {
                'season': season,
                'event_name': event_name,
                'session_type': session_type
            }
        }
        
        for driver in drivers:
            try:
                telemetry = data_processor.get_driver_telemetry(session, driver, lap_type)
                comparison_data['drivers'].append(telemetry)
            except Exception as e:
                logger.warning(f"Could not get data for driver {driver}: {str(e)}")
        
        return jsonify(comparison_data)
        
    except Exception as e:
        logger.error(f"Error comparing drivers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/weather/<int:season>/<event_name>/<session_type>', methods=['GET'])
def get_weather_data(season, event_name, session_type):
    """Get weather data for a session"""
    try:
        session = data_processor.get_session(season, event_name, session_type)
        
        # Get weather data from session
        weather_data = {
            'air_temp': float(session.weather_data['AirTemp'].mean()) if hasattr(session, 'weather_data') else 25.0,
            'track_temp': float(session.weather_data['TrackTemp'].mean()) if hasattr(session, 'weather_data') else 35.0,
            'humidity': float(session.weather_data['Humidity'].mean()) if hasattr(session, 'weather_data') else 60.0,
            'pressure': 1013.25,  # Standard atmospheric pressure
            'wind_speed': 5.0,    # Mock data
            'wind_direction': 180, # Mock data
            'rainfall': False
        }
        
        return jsonify(weather_data)
        
    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Starting F1 Data API Backend...")
    logger.info(f"FastF1 version: {ff1.__version__}")
    logger.info(f"Cache directory: {cache_dir}")
    
    # Start the Flask development server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=False  # Disable reloader to prevent cache issues
    )