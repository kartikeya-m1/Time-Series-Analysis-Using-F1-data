import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Hyperspeed from './utils/Hyperspeed';
import { hyperspeedPresets } from './utils/hyperspeedPresets';
import F1DataPanel from './components/F1DataPanel';
import F1TimeSeries from './components/F1TimeSeries';
import F1InfoPanel from './components/F1InfoPanel';

const AppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  background: #000;
  font-family: 'Arial', sans-serif;
`;

const HyperspeedContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const UIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  
  * {
    pointer-events: auto;
  }
`;



const DataPanel = styled.div`
  position: absolute;
  left: 20px;
  top: 20px;
  width: 350px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #D856BF;
    border-radius: 4px;
  }
`;

const BottomPanel = styled.div`
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100vw - 40px);
  max-width: 1200px;
  z-index: 2;
`;

const Header = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 3;
`;

const Title = styled.h1`
  color: white;
  font-size: 2.5em;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(3, 179, 195, 0.8);
  margin: 0;
  background: linear-gradient(45deg, #03B3C3, #D856BF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2em;
  margin: 5px 0 0 0;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid #03B3C3;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  z-index: 3;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(3, 179, 195, 0.2);
    transform: scale(1.05);
  }
`;

const ViewToggle = styled.div`
  position: absolute;
  top: 80px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 3;
`;

const ViewButton = styled.button`
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

const KeyHint = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 0.9em;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 3;
`;

const App = () => {
  const [currentPreset, setCurrentPreset] = useState(hyperspeedPresets.one);
  const [effectOptions, setEffectOptions] = useState(hyperspeedPresets.one);
  const [showUI, setShowUI] = useState(true);
  const [showTimeSeries, setShowTimeSeries] = useState(false);
  const [isSpeedingUp, setIsSpeedingUp] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  
  // Enhanced session state tracking
  const [currentSession, setCurrentSession] = useState({
    season: 2024,
    eventName: 'Monaco Grand Prix',
    sessionType: 'Q'
  });
  const [showInfoPanel, setShowInfoPanel] = useState(true);



  const handleDriverSelect = (driverCode, season, eventName, sessionType) => {
    setSelectedDriver(driverCode);
    setCurrentSession({ season, eventName, sessionType });
    console.log(`Selected driver: ${driverCode} for ${season} ${eventName} ${sessionType}`);
    
    // Show time series when a driver is selected
    if (!showTimeSeries) {
      setShowTimeSeries(true);
    }
  };

  const handleTelemetryDataChange = (data) => {
    setTelemetryData(data);
    
    // Enhanced integration of telemetry data with Hyperspeed effects
    if (data && data.statistics) {
      const { statistics } = data;
      
      // Calculate effect parameters based on F1 telemetry
      const speedRatio = (statistics.max_speed || 300) / 350; // Normalize to F1 max speed
      const aggressionRatio = (statistics.throttle_percentage || 50) / 100;
      const gearRatio = (statistics.top_gear || 6) / 8;
      
      // Update hyperspeed effects based on real telemetry
      setEffectOptions(prev => ({
        ...prev,
        speed: 0.3 + (speedRatio * 1.2), // Speed based on max speed achieved
        density: 50 + (aggressionRatio * 100), // Particle density based on throttle usage
        colorIntensity: 0.5 + (speedRatio * 0.5), // Color intensity based on speed
        distortionLevel: aggressionRatio * 0.3 // Distortion based on driving style
      }));
      
      console.log('Updated Hyperspeed effects based on telemetry:', {
        maxSpeed: statistics.max_speed,
        throttleUsage: statistics.throttle_percentage,
        topGear: statistics.top_gear
      });
    }
  };

  useEffect(() => {
    // Enhanced keyboard controls
    const handleKeyPress = (event) => {
      switch (event.key.toLowerCase()) {
        case 'h':
          setShowUI(!showUI);
          break;
        case 't':
          setShowTimeSeries(!showTimeSeries);
          break;
        case 'i':
          setShowInfoPanel(!showInfoPanel);
          break;
        case 'escape':
          setShowUI(true);
          setShowInfoPanel(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showUI, showTimeSeries, showInfoPanel]);

  // Initialize with first preset
  useEffect(() => {
    setCurrentPreset(hyperspeedPresets.one);
    setEffectOptions(hyperspeedPresets.one);
  }, []);

  return (
    <AppContainer>
      <HyperspeedContainer>
        <Hyperspeed effectOptions={effectOptions} />
      </HyperspeedContainer>

      <Header>
        <Title>F1 HYPERSPEED DASHBOARD</Title>
        <Subtitle>Powered by Fast-F1 • H=UI • T=Charts • I=Info • Real F1 Telemetry Data</Subtitle>
      </Header>

      <ToggleButton onClick={() => setShowUI(!showUI)}>
        {showUI ? 'Hide UI' : 'Show UI'}
      </ToggleButton>

      <ViewToggle>
        <ViewButton 
          active={showTimeSeries}
          onClick={() => setShowTimeSeries(!showTimeSeries)}
        >
          {showTimeSeries ? 'Hide Charts' : 'Show Charts'}
        </ViewButton>
        <ViewButton 
          active={showInfoPanel}
          onClick={() => setShowInfoPanel(!showInfoPanel)}
        >
          {showInfoPanel ? 'Hide Info' : 'Show Info'}
        </ViewButton>
      </ViewToggle>

      {showUI && (
        <UIOverlay>
          <DataPanel>
            <F1DataPanel 
              onDriverSelect={handleDriverSelect}
              selectedDriver={selectedDriver}
            />
          </DataPanel>
          
          {/* Real-time F1 information panel */}
          {showInfoPanel && (
            <F1InfoPanel 
              season={currentSession.season}
              eventName={currentSession.eventName}
              sessionType={currentSession.sessionType}
              selectedDriver={selectedDriver}
            />
          )}
        </UIOverlay>
      )}

      {showTimeSeries && showUI && (
        <BottomPanel>
          <F1TimeSeries onDataChange={handleTelemetryDataChange} />
        </BottomPanel>
      )}

      <KeyHint>
        Hold mouse to speed up • H=UI • T=Charts • I=Info • ESC=Reset
        {telemetryData && telemetryData.statistics && (
          <div style={{ marginTop: '5px', fontSize: '0.8em', opacity: 0.8 }}>
            {selectedDriver}: {Math.round(telemetryData.statistics.max_speed)}km/h max • 
            {telemetryData.statistics.throttle_percentage?.toFixed(1)}% throttle • 
            Gear {telemetryData.statistics.top_gear} • 
            {telemetryData.tire_info?.compound || 'Unknown'} tires
          </div>
        )}
      </KeyHint>
    </AppContainer>
  );
};

export default App;