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
        """Extract comprehensive telemetry data for a specific driver"""
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
            
            # Add tire and weather context
            tire_info = self.get_tire_info(lap)
            weather_info = self.get_weather_context(session)
            
            # Convert to serializable format with enhanced data
            telemetry_data = {
                'driver': driver_code,
                'lap_time': float(lap['LapTime'].total_seconds()) if pd.notna(lap['LapTime']) else None,
                'lap_number': int(lap['LapNumber']) if pd.notna(lap['LapNumber']) else None,
                'time': telemetry['Time'].dt.total_seconds().tolist(),
                'distance': telemetry['Distance'].fillna(0).tolist(),
                'speed': telemetry['Speed'].fillna(0).tolist(),
                'throttle': telemetry['Throttle'].fillna(0).tolist(),
                'brake': telemetry['Brake'].fillna(False).astype(bool).tolist(),
                'gear': telemetry['nGear'].fillna(1).astype(int).tolist(),
                'rpm': telemetry['RPM'].fillna(8000).tolist(),
                'drs': telemetry['DRS'].fillna(0).astype(int).tolist() if 'DRS' in telemetry.columns else [0] * len(telemetry),
                
                # Additional F1-specific data
                'tire_info': tire_info,
                'weather_info': weather_info,
                'track_status': self.get_track_status(session, lap),
                'sector_times': {
                    'sector_1': float(lap['Sector1Time'].total_seconds()) if pd.notna(lap['Sector1Time']) else None,
                    'sector_2': float(lap['Sector2Time'].total_seconds()) if pd.notna(lap['Sector2Time']) else None,
                    'sector_3': float(lap['Sector3Time'].total_seconds()) if pd.notna(lap['Sector3Time']) else None
                }
            }
            
            # Calculate comprehensive F1 statistics
            stats = self.calculate_f1_statistics(telemetry, lap)
            
            telemetry_data['statistics'] = stats
            
            return telemetry_data
            
        except Exception as e:
            logger.error(f"Error extracting telemetry for {driver_code}: {str(e)}")
            raise
    
    def get_tire_info(self, lap):
        """Extract tire compound and usage information"""
        try:
            return {
                'compound': lap['Compound'] if 'Compound' in lap and pd.notna(lap['Compound']) else 'UNKNOWN',
                'fresh_tyre': bool(lap['FreshTyre']) if 'FreshTyre' in lap and pd.notna(lap['FreshTyre']) else False,
                'tyre_life': int(lap['TyreLife']) if 'TyreLife' in lap and pd.notna(lap['TyreLife']) else 0,
                'stint_number': int(lap['Stint']) if 'Stint' in lap and pd.notna(lap['Stint']) else 1
            }
        except Exception:
            return {
                'compound': 'UNKNOWN',
                'fresh_tyre': False,
                'tyre_life': 0,
                'stint_number': 1
            }
    
    def get_weather_context(self, session):
        """Extract weather information for the session"""
        try:
            if hasattr(session, 'weather_data') and not session.weather_data.empty:
                weather = session.weather_data.iloc[-1]  # Get latest weather
                return {
                    'air_temp': float(weather.get('AirTemp', 25.0)),
                    'track_temp': float(weather.get('TrackTemp', 35.0)),
                    'humidity': float(weather.get('Humidity', 60.0)),
                    'pressure': float(weather.get('Pressure', 1013.25)),
                    'wind_speed': float(weather.get('WindSpeed', 5.0)),
                    'wind_direction': float(weather.get('WindDirection', 180.0)),
                    'rainfall': bool(weather.get('Rainfall', False))
                }
            else:
                return {
                    'air_temp': 25.0,
                    'track_temp': 35.0,
                    'humidity': 60.0,
                    'pressure': 1013.25,
                    'wind_speed': 5.0,
                    'wind_direction': 180.0,
                    'rainfall': False
                }
        except Exception:
            return {
                'air_temp': 25.0,
                'track_temp': 35.0,
                'humidity': 60.0,
                'pressure': 1013.25,
                'wind_speed': 5.0,
                'wind_direction': 180.0,
                'rainfall': False
            }
    
    def get_track_status(self, session, lap):
        """Get track status information"""
        try:
            return {
                'track_status': getattr(lap, 'TrackStatus', 1),  # 1 = Green, 2 = Yellow, etc.
                'is_personal_best': bool(getattr(lap, 'IsPersonalBest', False)),
                'position': int(lap['Position']) if 'Position' in lap and pd.notna(lap['Position']) else None,
                'pit_out_time': bool(getattr(lap, 'PitOutTime', False)),
                'pit_in_time': bool(getattr(lap, 'PitInTime', False))
            }
        except Exception:
            return {
                'track_status': 1,
                'is_personal_best': False,
                'position': None,
                'pit_out_time': False,
                'pit_in_time': False
            }
    
    def calculate_f1_statistics(self, telemetry, lap):
        """Calculate comprehensive F1 performance statistics"""
        try:
            # Basic speed statistics
            speed_data = telemetry['Speed'].dropna()
            throttle_data = telemetry['Throttle'].dropna()
            brake_data = telemetry['Brake'].dropna()
            
            # Calculate advanced metrics
            full_throttle_time = len(throttle_data[throttle_data >= 99]) / len(throttle_data) * 100 if len(throttle_data) > 0 else 0
            braking_time = len(brake_data[brake_data == True]) / len(brake_data) * 100 if len(brake_data) > 0 else 0
            
            return {
                # Speed metrics
                'max_speed': float(speed_data.max()) if not speed_data.empty else 0,
                'avg_speed': float(speed_data.mean()) if not speed_data.empty else 0,
                'min_speed': float(speed_data.min()) if not speed_data.empty else 0,
                'speed_std': float(speed_data.std()) if not speed_data.empty else 0,
                
                # Mechanical metrics
                'top_gear': int(telemetry['nGear'].max()) if not telemetry['nGear'].empty else 1,
                'max_rpm': float(telemetry['RPM'].max()) if not telemetry['RPM'].empty else 0,
                'avg_rpm': float(telemetry['RPM'].mean()) if not telemetry['RPM'].empty else 0,
                
                # Driving style metrics
                'throttle_percentage': float(full_throttle_time),
                'brake_percentage': float(braking_time),
                'coast_percentage': float(100 - full_throttle_time - braking_time),
                
                # Track metrics
                'total_distance': float(telemetry['Distance'].max()) if not telemetry['Distance'].empty else 0,
                'lap_time': float(lap['LapTime'].total_seconds()) if pd.notna(lap['LapTime']) else None,
                
                # DRS usage
                'drs_percentage': float(len(telemetry[telemetry.get('DRS', 0) > 0]) / len(telemetry) * 100) if 'DRS' in telemetry.columns else 0,
                
                # Gear changes (approximate)
                'gear_changes': int(len(telemetry['nGear'].diff().dropna().abs()[telemetry['nGear'].diff().dropna().abs() > 0]))
            }
        except Exception as e:
            logger.warning(f"Error calculating statistics: {str(e)}")
            return {
                'max_speed': 0, 'avg_speed': 0, 'min_speed': 0, 'speed_std': 0,
                'top_gear': 1, 'max_rpm': 0, 'avg_rpm': 0,
                'throttle_percentage': 0, 'brake_percentage': 0, 'coast_percentage': 100,
                'total_distance': 0, 'lap_time': None,
                'drs_percentage': 0, 'gear_changes': 0
            }

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
    """Get comprehensive weather data for a session"""
    try:
        session = data_processor.get_session(season, event_name, session_type)
        
        # Get detailed weather data from session
        if hasattr(session, 'weather_data') and not session.weather_data.empty:
            weather_df = session.weather_data
            
            weather_data = {
                'current': {
                    'air_temp': float(weather_df['AirTemp'].iloc[-1]) if 'AirTemp' in weather_df.columns else 25.0,
                    'track_temp': float(weather_df['TrackTemp'].iloc[-1]) if 'TrackTemp' in weather_df.columns else 35.0,
                    'humidity': float(weather_df['Humidity'].iloc[-1]) if 'Humidity' in weather_df.columns else 60.0,
                    'pressure': float(weather_df['Pressure'].iloc[-1]) if 'Pressure' in weather_df.columns else 1013.25,
                    'wind_speed': float(weather_df['WindSpeed'].iloc[-1]) if 'WindSpeed' in weather_df.columns else 5.0,
                    'wind_direction': float(weather_df['WindDirection'].iloc[-1]) if 'WindDirection' in weather_df.columns else 180.0,
                    'rainfall': bool(weather_df['Rainfall'].iloc[-1]) if 'Rainfall' in weather_df.columns else False
                },
                'session_evolution': {
                    'air_temp_range': [float(weather_df['AirTemp'].min()), float(weather_df['AirTemp'].max())] if 'AirTemp' in weather_df.columns else [25.0, 25.0],
                    'track_temp_range': [float(weather_df['TrackTemp'].min()), float(weather_df['TrackTemp'].max())] if 'TrackTemp' in weather_df.columns else [35.0, 35.0],
                    'humidity_range': [float(weather_df['Humidity'].min()), float(weather_df['Humidity'].max())] if 'Humidity' in weather_df.columns else [60.0, 60.0],
                    'rainfall_periods': int(weather_df['Rainfall'].sum()) if 'Rainfall' in weather_df.columns else 0
                }
            }
        else:
            # Fallback weather data
            weather_data = {
                'current': {
                    'air_temp': 25.0,
                    'track_temp': 35.0,
                    'humidity': 60.0,
                    'pressure': 1013.25,
                    'wind_speed': 5.0,
                    'wind_direction': 180.0,
                    'rainfall': False
                },
                'session_evolution': {
                    'air_temp_range': [25.0, 25.0],
                    'track_temp_range': [35.0, 35.0],
                    'humidity_range': [60.0, 60.0],
                    'rainfall_periods': 0
                }
            }
        
        return jsonify(weather_data)
        
    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tires/<int:season>/<event_name>/<session_type>', methods=['GET'])
def get_tire_strategy_data(season, event_name, session_type):
    """Get tire compound usage and strategy data for all drivers"""
    try:
        session = data_processor.get_session(season, event_name, session_type)
        laps_data = session.laps
        
        tire_strategies = {}
        compound_usage = {}
        
        # Analyze tire usage by driver
        for driver in laps_data['Driver'].unique():
            if pd.isna(driver):
                continue
                
            driver_laps = laps_data[laps_data['Driver'] == driver]
            
            # Driver tire strategy
            stints = []
            if not driver_laps.empty:
                current_compound = None
                stint_start = None
                
                for _, lap in driver_laps.iterrows():
                    compound = lap.get('Compound', 'UNKNOWN')
                    lap_num = lap.get('LapNumber', 0)
                    
                    if compound != current_compound:
                        if current_compound is not None:
                            stints.append({
                                'compound': current_compound,
                                'start_lap': stint_start,
                                'end_lap': lap_num - 1,
                                'duration': lap_num - stint_start
                            })
                        current_compound = compound
                        stint_start = lap_num
                
                # Add final stint
                if current_compound is not None:
                    stints.append({
                        'compound': current_compound,
                        'start_lap': stint_start,
                        'end_lap': int(driver_laps['LapNumber'].max()),
                        'duration': int(driver_laps['LapNumber'].max()) - stint_start + 1
                    })
            
            tire_strategies[driver] = {
                'total_stints': len(stints),
                'stints': stints,
                'compounds_used': list(set([stint['compound'] for stint in stints]))
            }
        
        # Overall compound usage statistics
        if 'Compound' in laps_data.columns:
            compound_counts = laps_data['Compound'].value_counts().to_dict()
            compound_usage = {
                'distribution': compound_counts,
                'most_popular': max(compound_counts.items(), key=lambda x: x[1])[0] if compound_counts else 'UNKNOWN',
                'total_compounds': len(compound_counts)
            }
        
        return jsonify({
            'session_info': {
                'season': season,
                'event_name': event_name,
                'session_type': session_type
            },
            'tire_strategies': tire_strategies,
            'compound_usage': compound_usage
        })
        
    except Exception as e:
        logger.error(f"Error fetching tire strategy data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session-summary/<int:season>/<event_name>/<session_type>', methods=['GET'])
def get_session_summary(season, event_name, session_type):
    """Get comprehensive session summary with key statistics"""
    try:
        session = data_processor.get_session(season, event_name, session_type)
        
        # Basic session info
        session_info = {
            'season': season,
            'event_name': event_name,
            'session_type': session_type,
            'date': session.date.strftime('%Y-%m-%d %H:%M:%S') if session.date else None,
            'total_laps': int(session.total_laps) if hasattr(session, 'total_laps') and session.total_laps else 0
        }
        
        # Get fastest lap information
        fastest_lap = session.laps.pick_fastest()
        fastest_lap_info = None
        if not fastest_lap.empty:
            fastest_lap_info = {
                'driver': fastest_lap['Driver'],
                'lap_time': str(fastest_lap['LapTime']),
                'lap_number': int(fastest_lap['LapNumber']),
                'compound': fastest_lap.get('Compound', 'UNKNOWN')
            }
        
        # Track limits and penalties (if available)
        track_limits = 0
        if hasattr(session, 'laps') and 'Deleted' in session.laps.columns:
            track_limits = int(session.laps['Deleted'].sum())
        
        return jsonify({
            'session_info': session_info,
            'fastest_lap': fastest_lap_info,
            'statistics': {
                'total_drivers': len(session.drivers) if hasattr(session, 'drivers') else 0,
                'total_laps_completed': int(len(session.laps)) if hasattr(session, 'laps') else 0,
                'track_limit_violations': track_limits,
                'session_duration': str(session.session_end_time - session.session_start_time) if hasattr(session, 'session_start_time') and hasattr(session, 'session_end_time') else None
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching session summary: {str(e)}")
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