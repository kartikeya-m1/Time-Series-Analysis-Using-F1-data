import axios from 'axios';

// Base URL for the Fast-F1 backend API
const API_BASE_URL = 'http://localhost:5000/api';

class F1DataService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds timeout for data processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.axios.interceptors.request.use(
      (config) => {
        console.log(`[F1DataService] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[F1DataService] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => {
        console.log(`[F1DataService] Response received:`, response.status);
        return response;
      },
      (error) => {
        console.error('[F1DataService] Response error:', error);
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Backend server is not running. Please start the Fast-F1 Python backend.');
        }
        throw error;
      }
    );
  }

  /**
   * Get available F1 seasons
   */
  async getSeasons() {
    try {
      const response = await this.axios.get('/seasons');
      return response.data;
    } catch (error) {
      console.error('Error fetching seasons:', error);
      // Return mock data if backend is not available
      return [2023, 2024, 2025];
    }
  }

  /**
   * Get events (races) for a specific season
   */
  async getEvents(season = 2024) {
    try {
      const response = await this.axios.get(`/events/${season}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      // Return mock data
      return [
        { name: 'Bahrain Grand Prix', country: 'Bahrain', date: '2024-03-02', round: 1 },
        { name: 'Saudi Arabian Grand Prix', country: 'Saudi Arabia', date: '2024-03-09', round: 2 },
        { name: 'Australian Grand Prix', country: 'Australia', date: '2024-03-24', round: 3 },
        { name: 'Japanese Grand Prix', country: 'Japan', date: '2024-04-07', round: 4 },
        { name: 'Chinese Grand Prix', country: 'China', date: '2024-04-21', round: 5 },
        { name: 'Miami Grand Prix', country: 'USA', date: '2024-05-05', round: 6 },
        { name: 'Emilia Romagna Grand Prix', country: 'Italy', date: '2024-05-19', round: 7 },
        { name: 'Monaco Grand Prix', country: 'Monaco', date: '2024-05-26', round: 8 },
      ];
    }
  }

  /**
   * Get session data for a specific event
   */
  async getSessionData(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'Q') {
    try {
      const response = await this.axios.get(`/session/${season}/${eventName}/${sessionType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session data:', error);
      // Return mock session data
      return {
        session_type: sessionType,
        event_name: eventName,
        date: '2024-05-26',
        drivers: [
          { driver_code: 'HAM', full_name: 'Lewis Hamilton', team: 'Mercedes' },
          { driver_code: 'VER', full_name: 'Max Verstappen', team: 'Red Bull Racing' },
          { driver_code: 'LEC', full_name: 'Charles Leclerc', team: 'Ferrari' },
          { driver_code: 'RUS', full_name: 'George Russell', team: 'Mercedes' },
          { driver_code: 'PER', full_name: 'Sergio Perez', team: 'Red Bull Racing' },
          { driver_code: 'SAI', full_name: 'Carlos Sainz', team: 'Ferrari' },
          { driver_code: 'NOR', full_name: 'Lando Norris', team: 'McLaren' },
          { driver_code: 'PIA', full_name: 'Oscar Piastri', team: 'McLaren' },
        ]
      };
    }
  }

  /**
   * Get enhanced telemetry data with tire and weather context
   */
  async getTelemetryData(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'Q', driverCode = 'HAM', lapType = 'fastest') {
    try {
      const response = await this.axios.get(`/telemetry/${season}/${eventName}/${sessionType}/${driverCode}/${lapType}`);
      
      // Enhance response data with additional context
      const telemetryData = response.data;
      
      // Add enhanced statistics if not present
      if (!telemetryData.statistics || !telemetryData.statistics.throttle_percentage) {
        telemetryData.statistics = this.calculateEnhancedStatistics(telemetryData);
      }
      
      return telemetryData;
    } catch (error) {
      console.error('Error fetching telemetry data:', error);
      // Return mock telemetry data with realistic F1 patterns
      return this.generateMockTelemetryData(driverCode, sessionType);
    }
  }

  /**
   * Calculate enhanced statistics from telemetry data
   */
  calculateEnhancedStatistics(telemetryData) {
    if (!telemetryData.speed || !telemetryData.throttle || !telemetryData.brake) {
      return {};
    }

    const { speed, throttle, brake, gear, rpm } = telemetryData;
    
    // Calculate percentages
    const fullThrottleTime = throttle.filter(t => t >= 99).length / throttle.length * 100;
    const brakingTime = brake.filter(b => b === true || b > 50).length / brake.length * 100;
    const coastingTime = 100 - fullThrottleTime - brakingTime;
    
    // Calculate gear changes
    let gearChanges = 0;
    for (let i = 1; i < gear.length; i++) {
      if (gear[i] !== gear[i-1]) gearChanges++;
    }
    
    return {
      max_speed: Math.max(...speed),
      avg_speed: speed.reduce((a, b) => a + b, 0) / speed.length,
      min_speed: Math.min(...speed),
      speed_std: this.calculateStandardDeviation(speed),
      top_gear: Math.max(...gear),
      max_rpm: Math.max(...rpm),
      avg_rpm: rpm.reduce((a, b) => a + b, 0) / rpm.length,
      throttle_percentage: fullThrottleTime,
      brake_percentage: brakingTime,
      coast_percentage: coastingTime,
      gear_changes: gearChanges,
      drs_percentage: telemetryData.drs ? 
        telemetryData.drs.filter(d => d > 0).length / telemetryData.drs.length * 100 : 0
    };
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Get lap times data for comparison
   */
  async getLapTimes(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'Q') {
    try {
      const response = await this.axios.get(`/laptimes/${season}/${eventName}/${sessionType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lap times:', error);
      // Return mock lap times
      return [
        { driver: 'HAM', lap_time: '1:23.456', lap_number: 12, position: 1 },
        { driver: 'VER', lap_time: '1:23.789', lap_number: 8, position: 2 },
        { driver: 'LEC', lap_time: '1:24.123', lap_number: 15, position: 3 },
        { driver: 'RUS', lap_time: '1:24.456', lap_number: 10, position: 4 },
        { driver: 'PER', lap_time: '1:24.789', lap_number: 11, position: 5 },
        { driver: 'SAI', lap_time: '1:25.012', lap_number: 9, position: 6 },
        { driver: 'NOR', lap_time: '1:25.345', lap_number: 13, position: 7 },
        { driver: 'PIA', lap_time: '1:25.678', lap_number: 14, position: 8 },
      ];
    }
  }

  /**
   * Get real-time race data (for live sessions)
   */
  async getLiveData(season = 2024, eventName = 'Monaco Grand Prix') {
    try {
      const response = await this.axios.get(`/live/${season}/${eventName}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live data:', error);
      // Return mock live data
      return {
        session_status: 'Live',
        current_lap: 45,
        total_laps: 78,
        leader: 'VER',
        positions: [
          { position: 1, driver: 'VER', gap: '0.000', last_lap: '1:24.123' },
          { position: 2, driver: 'HAM', gap: '+2.345', last_lap: '1:24.456' },
          { position: 3, driver: 'LEC', gap: '+5.678', last_lap: '1:24.789' },
        ]
      };
    }
  }

  /**
   * Generate realistic mock telemetry data with enhanced F1 structure
   */
  generateMockTelemetryData(driverCode, sessionType) {
    const trackProfiles = {
      'Monaco': { maxSpeed: 290, avgSpeed: 180, sectors: 3, lapTime: 83.5 },
      'Monza': { maxSpeed: 360, avgSpeed: 240, sectors: 3, lapTime: 80.2 },
      'Silverstone': { maxSpeed: 340, avgSpeed: 220, sectors: 3, lapTime: 87.8 }
    };

    const track = trackProfiles['Monaco']; // Default to Monaco
    const points = 200; // Data points per lap
    const timeStep = track.lapTime / points;

    const telemetryData = {
      driver: driverCode,
      lap_time: track.lapTime,
      lap_number: Math.floor(Math.random() * 20) + 1,
      time: [],
      distance: [],
      speed: [],
      throttle: [],
      brake: [],
      gear: [],
      rpm: [],
      drs: [],
      // Enhanced F1 data structure
      tire_info: {
        compound: ['SOFT', 'MEDIUM', 'HARD'][Math.floor(Math.random() * 3)],
        fresh_tyre: Math.random() > 0.7,
        tyre_life: Math.floor(Math.random() * 15),
        stint_number: Math.floor(Math.random() * 3) + 1
      },
      weather_info: {
        air_temp: 22.5 + (Math.random() - 0.5) * 5,
        track_temp: 35.2 + (Math.random() - 0.5) * 8,
        humidity: 65 + (Math.random() - 0.5) * 20,
        pressure: 1013.25,
        wind_speed: 5.0 + Math.random() * 10,
        wind_direction: Math.random() * 360,
        rainfall: Math.random() > 0.85
      },
      track_status: {
        track_status: 1, // Green flag
        is_personal_best: Math.random() > 0.7,
        position: Math.floor(Math.random() * 20) + 1,
        pit_out_time: false,
        pit_in_time: false
      },
      sector_times: {
        sector_1: 28.123 + (Math.random() - 0.5) * 2,
        sector_2: 31.456 + (Math.random() - 0.5) * 2,
        sector_3: 24.877 + (Math.random() - 0.5) * 2
      }
    };

    for (let i = 0; i < points; i++) {
      const time = i * timeStep;
      const progress = i / points;
      
      telemetryData.time.push(time);
      telemetryData.distance.push(progress * 3337); // Monaco track length
      
      // Generate realistic speed profile
      let speed;
      if (progress < 0.2) { // Start/finish straight
        speed = track.maxSpeed * (0.7 + 0.3 * Math.sin(progress * Math.PI * 10));
      } else if (progress < 0.4) { // Slow corners (Casino, Mirabeau)
        speed = track.maxSpeed * (0.3 + 0.2 * Math.sin(progress * Math.PI * 15));
      } else if (progress < 0.6) { // Mid-section
        speed = track.maxSpeed * (0.5 + 0.3 * Math.sin(progress * Math.PI * 8));
      } else if (progress < 0.8) { // Tunnel and chicane
        speed = track.maxSpeed * (0.6 + 0.2 * Math.sin(progress * Math.PI * 12));
      } else { // Final section
        speed = track.maxSpeed * (0.4 + 0.4 * Math.sin(progress * Math.PI * 6));
      }
      
      speed += (Math.random() - 0.5) * 10; // Add noise
      telemetryData.speed.push(Math.max(50, speed));
      
      // Generate throttle based on speed changes
      const speedChange = i > 0 ? speed - telemetryData.speed[i-1] : 0;
      let throttle = Math.max(0, Math.min(100, 70 + speedChange * 3 + (Math.random() - 0.5) * 20));
      telemetryData.throttle.push(throttle);
      
      // Generate brake (boolean for real F1 data)
      let brake = speedChange < -5 ? true : (Math.random() < 0.05);
      telemetryData.brake.push(brake);
      
      // Generate gear based on speed
      let gear = Math.max(1, Math.min(8, Math.floor(speed / 45) + 1));
      telemetryData.gear.push(gear);
      
      // Generate RPM based on gear and speed
      const rpmBase = 6000 + (speed / track.maxSpeed) * 6000;
      telemetryData.rpm.push(rpmBase + (Math.random() - 0.5) * 500);
      
      // Generate DRS (mostly on straights)
      const drs = (progress < 0.25 || progress > 0.75) && speed > 200 ? 1 : 0;
      telemetryData.drs.push(drs);
    }

    // Calculate enhanced statistics
    telemetryData.statistics = this.calculateEnhancedStatistics(telemetryData);

    return {
      ...telemetryData,
      track_info: {
        name: 'Monaco',
        country: 'Monaco',
        length: 3337
      }
    };
  }

  /**
   * Compare multiple drivers' telemetry data
   */
  async compareDrivers(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'Q', drivers = ['HAM', 'VER'], lapType = 'fastest') {
    try {
      const promises = drivers.map(driver => 
        this.getTelemetryData(season, eventName, sessionType, driver, lapType)
      );
      const results = await Promise.all(promises);
      
      return {
        comparison_type: 'telemetry',
        drivers: drivers,
        data: results
      };
    } catch (error) {
      console.error('Error comparing drivers:', error);
      throw error;
    }
  }

  /**
   * Get weather data for a session with detailed evolution
   */
  async getWeatherData(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'Q') {
    try {
      const response = await this.axios.get(`/weather/${season}/${eventName}/${sessionType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return mock weather data
      return {
        current: {
          air_temp: 22.5,
          track_temp: 35.2,
          humidity: 65,
          pressure: 1013.2,
          wind_speed: 3.2,
          wind_direction: 180,
          rainfall: false
        },
        session_evolution: {
          air_temp_range: [20.5, 24.8],
          track_temp_range: [32.1, 38.9],
          humidity_range: [58, 72],
          rainfall_periods: 0
        }
      };
    }
  }

  /**
   * Get comprehensive tire strategy data for all drivers
   */
  async getTireStrategyData(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'R') {
    try {
      const response = await this.axios.get(`/tires/${season}/${eventName}/${sessionType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tire strategy data:', error);
      // Return mock tire strategy data
      return {
        session_info: {
          season: season,
          event_name: eventName,
          session_type: sessionType
        },
        tire_strategies: {
          'VER': {
            total_stints: 2,
            stints: [
              { compound: 'MEDIUM', start_lap: 1, end_lap: 35, duration: 35 },
              { compound: 'HARD', start_lap: 36, end_lap: 70, duration: 35 }
            ],
            compounds_used: ['MEDIUM', 'HARD']
          },
          'HAM': {
            total_stints: 3,
            stints: [
              { compound: 'SOFT', start_lap: 1, end_lap: 15, duration: 15 },
              { compound: 'MEDIUM', start_lap: 16, end_lap: 45, duration: 30 },
              { compound: 'HARD', start_lap: 46, end_lap: 70, duration: 25 }
            ],
            compounds_used: ['SOFT', 'MEDIUM', 'HARD']
          }
        },
        compound_usage: {
          distribution: { 'MEDIUM': 45, 'HARD': 35, 'SOFT': 20 },
          most_popular: 'MEDIUM',
          total_compounds: 3
        }
      };
    }
  }

  /**
   * Get comprehensive session summary with key statistics
   */
  async getSessionSummary(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'Q') {
    try {
      const response = await this.axios.get(`/session-summary/${season}/${eventName}/${sessionType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session summary:', error);
      // Return mock session summary
      return {
        session_info: {
          season: season,
          event_name: eventName,
          session_type: sessionType,
          date: '2024-05-26 14:00:00',
          total_laps: 156
        },
        fastest_lap: {
          driver: 'LEC',
          lap_time: '0 days 00:01:23.456000',
          lap_number: 12,
          compound: 'SOFT'
        },
        statistics: {
          total_drivers: 20,
          total_laps_completed: 156,
          track_limit_violations: 8,
          session_duration: '1:30:00'
        }
      };
    }
  }

  /**
   * Stream live timing data using WebSocket (if available)
   */
  connectLiveTiming(eventName, onDataReceived) {
    try {
      const wsUrl = `ws://localhost:5000/ws/live/${eventName}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[F1DataService] Live timing connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onDataReceived(data);
      };
      
      ws.onerror = (error) => {
        console.error('[F1DataService] WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('[F1DataService] Live timing disconnected');
      };
      
      return ws;
    } catch (error) {
      console.error('Error connecting to live timing:', error);
      return null;
    }
  }
}

// Export a singleton instance
export default new F1DataService();