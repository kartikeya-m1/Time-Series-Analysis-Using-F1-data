import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import F1DataService from '../services/F1DataService';

const Container = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(216, 86, 191, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  max-height: 600px;
  overflow-y: auto;
`;

const Title = styled.h3`
  color: #D856BF;
  margin: 0 0 20px 0;
  font-size: 1.4em;
  text-shadow: 0 0 10px rgba(216, 86, 191, 0.5);
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(216, 86, 191, 0.5);
  border-radius: 5px;
  padding: 8px 12px;
  font-size: 0.9em;
  outline: none;
  
  &:focus {
    border-color: #D856BF;
    box-shadow: 0 0 10px rgba(216, 86, 191, 0.3);
  }
  
  option {
    background: #1a1a1a;
    color: white;
  }
`;

const SessionSelector = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const SessionButton = styled.button`
  background: ${props => props.active ? '#D856BF' : 'rgba(216, 86, 191, 0.2)'};
  color: white;
  border: 1px solid #D856BF;
  border-radius: 5px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s ease;
  
  &:hover {
    background: #D856BF;
    transform: translateY(-1px);
  }
`;

const DataSection = styled.div`
  margin-bottom: 25px;
`;

const SectionTitle = styled.h4`
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 15px 0;
  font-size: 1.1em;
  border-bottom: 1px solid rgba(216, 86, 191, 0.3);
  padding-bottom: 5px;
`;

const DriverGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
`;

const DriverCard = styled.div`
  background: rgba(216, 86, 191, 0.1);
  border: 1px solid rgba(216, 86, 191, 0.3);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background: rgba(216, 86, 191, 0.2);
    transform: translateY(-2px);
  }
`;

const DriverName = styled.div`
  color: #D856BF;
  font-weight: bold;
  font-size: 1em;
  margin-bottom: 5px;
`;

const DriverDetails = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9em;
  line-height: 1.4;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
`;

const StatBox = styled.div`
  background: rgba(216, 86, 191, 0.1);
  border: 1px solid rgba(216, 86, 191, 0.3);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8em;
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  color: #D856BF;
  font-size: 1.1em;
  font-weight: bold;
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #D856BF;
  font-size: 1.1em;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  text-align: center;
  padding: 15px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  margin-top: 10px;
  font-size: 0.9em;
`;

const F1DataPanel = ({ onDriverSelect, selectedDriver }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [season, setSeason] = useState(2024);
  const [eventName, setEventName] = useState('Monaco Grand Prix');
  const [sessionType, setSessionType] = useState('Q');
  const [sessionData, setSessionData] = useState(null);
  const [events, setEvents] = useState([]);
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (season) {
      loadEvents(season);
    }
  }, [season]);

  useEffect(() => {
    if (season && eventName && sessionType) {
      loadSessionData();
    }
  }, [season, eventName, sessionType]);

  const loadSeasons = async () => {
    try {
      const availableSeasons = await F1DataService.getSeasons();
      setSeasons(availableSeasons);
    } catch (err) {
      console.error('Error loading seasons:', err);
      setSeasons([2023, 2024, 2025]); // Fallback
    }
  };

  const loadEvents = async (selectedSeason) => {
    try {
      const eventData = await F1DataService.getEvents(selectedSeason);
      setEvents(eventData);
      if (eventData.length > 0 && !eventData.find(e => e.name === eventName)) {
        setEventName(eventData[0].name);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    }
  };

  const loadSessionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await F1DataService.getSessionData(season, eventName, sessionType);
      setSessionData(data);
    } catch (err) {
      console.error('Error loading session data:', err);
      setError('Failed to load session data. Using mock data.');
      
      // Fallback to mock data
      setSessionData({
        drivers: [
          { driver_code: 'HAM', full_name: 'Lewis Hamilton', team: 'Mercedes', position: 1, time: '1:23.456' },
          { driver_code: 'VER', full_name: 'Max Verstappen', team: 'Red Bull Racing', position: 2, time: '1:23.789' },
          { driver_code: 'LEC', full_name: 'Charles Leclerc', team: 'Ferrari', position: 3, time: '1:24.123' },
          { driver_code: 'RUS', full_name: 'George Russell', team: 'Mercedes', position: 4, time: '1:24.456' },
          { driver_code: 'PER', full_name: 'Sergio Perez', team: 'Red Bull Racing', position: 5, time: '1:24.789' },
          { driver_code: 'SAI', full_name: 'Carlos Sainz', team: 'Ferrari', position: 6, time: '1:25.012' },
          { driver_code: 'NOR', full_name: 'Lando Norris', team: 'McLaren', position: 7, time: '1:25.345' },
          { driver_code: 'PIA', full_name: 'Oscar Piastri', team: 'McLaren', position: 8, time: '1:25.678' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDriverClick = (driverCode) => {
    if (onDriverSelect) {
      onDriverSelect(driverCode, season, eventName, sessionType);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === 'None') return 'N/A';
    return timeStr;
  };

  const sessionTypes = [
    { code: 'FP1', name: 'Free Practice 1' },
    { code: 'FP2', name: 'Free Practice 2' },
    { code: 'FP3', name: 'Free Practice 3' },
    { code: 'Q', name: 'Qualifying' },
    { code: 'R', name: 'Race' }
  ];

  return (
    <Container>
      <Title>F1 Session Data</Title>
      
      <Controls>
        <Select value={season} onChange={(e) => setSeason(parseInt(e.target.value))}>
          {seasons.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </Select>
        
        <Select value={eventName} onChange={(e) => setEventName(e.target.value)}>
          {events.map(event => (
            <option key={event.name} value={event.name}>
              {event.name}
            </option>
          ))}
        </Select>
      </Controls>

      <SessionSelector>
        {sessionTypes.map(session => (
          <SessionButton
            key={session.code}
            active={sessionType === session.code}
            onClick={() => setSessionType(session.code)}
          >
            {session.name}
          </SessionButton>
        ))}
      </SessionSelector>

      {loading && <LoadingIndicator>Loading session data...</LoadingIndicator>}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {sessionData && !loading && (
        <>
          <DataSection>
            <SectionTitle>Session: {eventName} - {sessionTypes.find(s => s.code === sessionType)?.name}</SectionTitle>
            <StatGrid>
              <StatBox>
                <StatLabel>Season</StatLabel>
                <StatValue>{season}</StatValue>
              </StatBox>
              <StatBox>
                <StatLabel>Drivers</StatLabel>
                <StatValue>{sessionData.drivers?.length || 0}</StatValue>
              </StatBox>
              <StatBox>
                <StatLabel>Event</StatLabel>
                <StatValue>{eventName.split(' ')[0]}</StatValue>
              </StatBox>
              <StatBox>
                <StatLabel>Session</StatLabel>
                <StatValue>{sessionType}</StatValue>
              </StatBox>
            </StatGrid>
          </DataSection>

          <DataSection>
            <SectionTitle>
              Driver Results 
              {selectedDriver && <span style={{color: '#03B3C3'}}> (Selected: {selectedDriver})</span>}
            </SectionTitle>
            <DriverGrid>
              {sessionData.drivers?.map((driver, index) => (
                <DriverCard 
                  key={driver.driver_code} 
                  onClick={() => handleDriverClick(driver.driver_code)}
                  style={{
                    borderColor: selectedDriver === driver.driver_code ? '#03B3C3' : 'rgba(216, 86, 191, 0.3)',
                    background: selectedDriver === driver.driver_code ? 'rgba(3, 179, 195, 0.2)' : 'rgba(216, 86, 191, 0.1)'
                  }}
                >
                  <DriverName>
                    P{driver.position || index + 1} {driver.full_name}
                  </DriverName>
                  <DriverDetails>
                    Code: {driver.driver_code}<br/>
                    Team: {driver.team}<br/>
                    Time: {formatTime(driver.time)}<br/>
                    Points: {driver.points || 0}
                  </DriverDetails>
                </DriverCard>
              ))}
            </DriverGrid>
          </DataSection>
        </>
      )}
    </Container>
  );
};

export default F1DataPanel;