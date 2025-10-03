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
   * Get telemetry data for a specific driver and lap
   */
  async getTelemetryData(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'Q', driverCode = 'HAM', lapType = 'fastest') {
    try {
      const response = await this.axios.get(`/telemetry/${season}/${eventName}/${sessionType}/${driverCode}/${lapType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching telemetry data:', error);
      // Return mock telemetry data with realistic F1 patterns
      return this.generateMockTelemetryData(driverCode, sessionType);
    }
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
   * Generate realistic mock telemetry data
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
      session: sessionType,
      lap_time: `1:${(track.lapTime % 60).toFixed(3).padStart(6, '0')}`,
      time: [],
      distance: [],
      speed: [],
      throttle: [],
      brake: [],
      gear: [],
      rpm: [],
      drs: []
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
      
      // Generate brake (inverse relationship with throttle)
      let brake = speedChange < -5 ? Math.min(100, -speedChange * 5 + Math.random() * 10) : Math.random() * 5;
      telemetryData.brake.push(brake);
      
      // Generate gear based on speed
      let gear = Math.max(1, Math.min(8, Math.floor(speed / 45) + 1));
      telemetryData.gear.push(gear);
      
      // Generate RPM based on gear and speed
      const rpmBase = 4000 + (speed / track.maxSpeed) * 8000;
      telemetryData.rpm.push(rpmBase + (Math.random() - 0.5) * 500);
      
      // Generate DRS (mostly on straights)
      const drs = (progress < 0.25 || progress > 0.75) && speed > 200 ? 1 : 0;
      telemetryData.drs.push(drs);
    }

    // Calculate statistics
    const stats = {
      max_speed: Math.max(...telemetryData.speed).toFixed(1),
      avg_speed: (telemetryData.speed.reduce((a, b) => a + b, 0) / telemetryData.speed.length).toFixed(1),
      top_gear: Math.max(...telemetryData.gear),
      max_rpm: Math.max(...telemetryData.rpm).toFixed(0),
      drs_activations: telemetryData.drs.filter(d => d === 1).length
    };

    return {
      ...telemetryData,
      statistics: stats,
      track_info: {
        name: 'Monaco',
        length: 3337,
        turns: 19,
        drs_zones: 1
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
   * Get weather data for a session
   */
  async getWeatherData(season = 2024, eventName = 'Monaco Grand Prix', sessionType = 'Q') {
    try {
      const response = await this.axios.get(`/weather/${season}/${eventName}/${sessionType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return mock weather data
      return {
        air_temp: 22.5,
        track_temp: 35.2,
        humidity: 65,
        pressure: 1013.2,
        wind_speed: 3.2,
        wind_direction: 180,
        rainfall: false
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