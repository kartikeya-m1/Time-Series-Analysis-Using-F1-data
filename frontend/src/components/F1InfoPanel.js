import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import F1DataService from '../services/F1DataService';

const InfoContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 400px;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 3;
`;

const InfoPanel = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(3, 179, 195, 0.5);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  backdrop-filter: blur(10px);
`;

const PanelTitle = styled.h3`
  color: #03B3C3;
  margin: 0 0 10px 0;
  font-size: 1.1em;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
  color: white;
  font-size: 0.9em;
`;

const InfoLabel = styled.span`
  color: #ccc;
`;

const InfoValue = styled.span`
  color: ${props => props.highlight ? '#FFD700' : '#fff'};
  font-weight: ${props => props.highlight ? 'bold' : 'normal'};
`;

const TireIndicator = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch(props.compound) {
      case 'SOFT': return '#FF3030';
      case 'MEDIUM': return '#FFD700';
      case 'HARD': return '#FFFFFF';
      default: return '#888';
    }
  }};
  margin-right: 5px;
`;

const StintBar = styled.div`
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin: 5px 0;
  display: flex;
`;

const StintSegment = styled.div`
  height: 100%;
  background: ${props => {
    switch(props.compound) {
      case 'SOFT': return '#FF3030';
      case 'MEDIUM': return '#FFD700';
      case 'HARD': return '#FFFFFF';
      default: return '#888';
    }
  }};
  flex: ${props => props.duration};
  border-right: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7em;
  color: #000;
  font-weight: bold;
`;

const F1InfoPanel = ({ season, eventName, sessionType, selectedDriver }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [tireData, setTireData] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);

  useEffect(() => {
    if (season && eventName && sessionType) {
      loadInfoData();
    }
  }, [season, eventName, sessionType]);

  const loadInfoData = async () => {
    try {
      // Load weather data
      const weather = await F1DataService.getWeatherData(season, eventName, sessionType);
      setWeatherData(weather);

      // Load tire strategy data (only for race sessions)
      if (sessionType === 'R' || sessionType === 'Race') {
        const tires = await F1DataService.getTireStrategyData(season, eventName, sessionType);
        setTireData(tires);
      }

      // Load session summary
      const summary = await F1DataService.getSessionSummary(season, eventName, sessionType);
      setSessionSummary(summary);

    } catch (error) {
      console.error('Error loading info data:', error);
    }
  };

  if (!season || !eventName || !sessionType) {
    return null;
  }

  return (
    <InfoContainer>
      {/* Weather Information */}
      {weatherData && (
        <InfoPanel>
          <PanelTitle>🌤️ Weather Conditions</PanelTitle>
          <InfoRow>
            <InfoLabel>Air Temperature:</InfoLabel>
            <InfoValue>{weatherData.current?.air_temp?.toFixed(1) || weatherData.air_temp?.toFixed(1)}°C</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Track Temperature:</InfoLabel>
            <InfoValue>{weatherData.current?.track_temp?.toFixed(1) || weatherData.track_temp?.toFixed(1)}°C</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Humidity:</InfoLabel>
            <InfoValue>{weatherData.current?.humidity?.toFixed(0) || weatherData.humidity?.toFixed(0)}%</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Wind Speed:</InfoLabel>
            <InfoValue>{weatherData.current?.wind_speed?.toFixed(1) || weatherData.wind_speed?.toFixed(1)} km/h</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Rainfall:</InfoLabel>
            <InfoValue highlight={weatherData.current?.rainfall || weatherData.rainfall}>
              {(weatherData.current?.rainfall || weatherData.rainfall) ? 'Yes' : 'No'}
            </InfoValue>
          </InfoRow>
          {weatherData.session_evolution && (
            <>
              <PanelTitle style={{ fontSize: '0.9em', marginTop: '10px' }}>Session Evolution</PanelTitle>
              <InfoRow>
                <InfoLabel>Air Temp Range:</InfoLabel>
                <InfoValue>{weatherData.session_evolution.air_temp_range[0].toFixed(1)}° - {weatherData.session_evolution.air_temp_range[1].toFixed(1)}°C</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Track Temp Range:</InfoLabel>
                <InfoValue>{weatherData.session_evolution.track_temp_range[0].toFixed(1)}° - {weatherData.session_evolution.track_temp_range[1].toFixed(1)}°C</InfoValue>
              </InfoRow>
            </>
          )}
        </InfoPanel>
      )}

      {/* Session Summary */}
      {sessionSummary && (
        <InfoPanel>
          <PanelTitle>📊 Session Summary</PanelTitle>
          <InfoRow>
            <InfoLabel>Total Drivers:</InfoLabel>
            <InfoValue>{sessionSummary.statistics?.total_drivers}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Total Laps:</InfoLabel>
            <InfoValue>{sessionSummary.statistics?.total_laps_completed}</InfoValue>
          </InfoRow>
          {sessionSummary.fastest_lap && (
            <>
              <InfoRow>
                <InfoLabel>Fastest Lap:</InfoLabel>
                <InfoValue highlight>{sessionSummary.fastest_lap.driver}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Time:</InfoLabel>
                <InfoValue>{sessionSummary.fastest_lap.lap_time}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Compound:</InfoLabel>
                <InfoValue>
                  <TireIndicator compound={sessionSummary.fastest_lap.compound} />
                  {sessionSummary.fastest_lap.compound}
                </InfoValue>
              </InfoRow>
            </>
          )}
          {sessionSummary.statistics?.track_limit_violations > 0 && (
            <InfoRow>
              <InfoLabel>Track Limits:</InfoLabel>
              <InfoValue highlight>{sessionSummary.statistics.track_limit_violations}</InfoValue>
            </InfoRow>
          )}
        </InfoPanel>
      )}

      {/* Tire Strategy (Race only) */}
      {tireData && selectedDriver && tireData.tire_strategies[selectedDriver] && (
        <InfoPanel>
          <PanelTitle>🏎️ {selectedDriver} Tire Strategy</PanelTitle>
          <InfoRow>
            <InfoLabel>Total Stints:</InfoLabel>
            <InfoValue>{tireData.tire_strategies[selectedDriver].total_stints}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Compounds Used:</InfoLabel>
            <InfoValue>
              {tireData.tire_strategies[selectedDriver].compounds_used.map(compound => (
                <span key={compound}>
                  <TireIndicator compound={compound} />
                  {compound}{' '}
                </span>
              ))}
            </InfoValue>
          </InfoRow>
          
          {/* Stint visualization */}
          <div style={{ marginTop: '10px' }}>
            <InfoLabel>Stint Strategy:</InfoLabel>
            <StintBar>
              {tireData.tire_strategies[selectedDriver].stints.map((stint, index) => (
                <StintSegment 
                  key={index}
                  compound={stint.compound}
                  duration={stint.duration}
                  title={`${stint.compound}: Laps ${stint.start_lap}-${stint.end_lap} (${stint.duration} laps)`}
                >
                  {stint.duration > 5 ? stint.compound.charAt(0) : ''}
                </StintSegment>
              ))}
            </StintBar>
          </div>
          
          {/* Individual stint details */}
          {tireData.tire_strategies[selectedDriver].stints.map((stint, index) => (
            <InfoRow key={index}>
              <InfoLabel>
                <TireIndicator compound={stint.compound} />
                Stint {index + 1}:
              </InfoLabel>
              <InfoValue>
                L{stint.start_lap}-{stint.end_lap} ({stint.duration} laps)
              </InfoValue>
            </InfoRow>
          ))}
        </InfoPanel>
      )}

      {/* Overall Tire Usage (Race only) */}
      {tireData && tireData.compound_usage && (
        <InfoPanel>
          <PanelTitle>🏁 Overall Tire Usage</PanelTitle>
          <InfoRow>
            <InfoLabel>Most Popular:</InfoLabel>
            <InfoValue>
              <TireIndicator compound={tireData.compound_usage.most_popular} />
              {tireData.compound_usage.most_popular}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Compounds Used:</InfoLabel>
            <InfoValue>{tireData.compound_usage.total_compounds}</InfoValue>
          </InfoRow>
          
          {/* Distribution bars */}
          {Object.entries(tireData.compound_usage.distribution).map(([compound, count]) => {
            const total = Object.values(tireData.compound_usage.distribution).reduce((a, b) => a + b, 0);
            const percentage = ((count / total) * 100).toFixed(1);
            return (
              <InfoRow key={compound}>
                <InfoLabel>
                  <TireIndicator compound={compound} />
                  {compound}:
                </InfoLabel>
                <InfoValue>{percentage}% ({count})</InfoValue>
              </InfoRow>
            );
          })}
        </InfoPanel>
      )}
    </InfoContainer>
  );
};

export default F1InfoPanel;