import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale
);

const Container = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(3, 179, 195, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  color: #03B3C3;
  margin: 0;
  font-size: 1.4em;
  text-shadow: 0 0 10px rgba(3, 179, 195, 0.5);
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(3, 179, 195, 0.5);
  border-radius: 5px;
  padding: 8px 12px;
  font-size: 0.9em;
  outline: none;
  
  &:focus {
    border-color: #03B3C3;
    box-shadow: 0 0 10px rgba(3, 179, 195, 0.3);
  }
  
  option {
    background: #1a1a1a;
    color: white;
  }
`;

const Button = styled.button`
  background: ${props => props.active ? '#03B3C3' : 'rgba(3, 179, 195, 0.2)'};
  color: white;
  border: 1px solid #03B3C3;
  border-radius: 5px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s ease;
  
  &:hover {
    background: #03B3C3;
    transform: translateY(-1px);
  }
`;

const ChartContainer = styled.div`
  height: 400px;
  position: relative;
  
  canvas {
    border-radius: 10px;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const StatBox = styled.div`
  background: rgba(3, 179, 195, 0.1);
  border: 1px solid rgba(3, 179, 195, 0.3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8em;
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  color: #03B3C3;
  font-size: 1.2em;
  font-weight: bold;
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #03B3C3;
  font-size: 1.1em;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  text-align: center;
  padding: 20px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  margin-top: 10px;
`;

const F1TimeSeries = ({ onDataChange }) => {
  const [telemetryData, setTelemetryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('HAM');
  const [selectedSession, setSelectedSession] = useState('Q');
  const [selectedLap, setSelectedLap] = useState('fastest');
  const [visibleMetrics, setVisibleMetrics] = useState({
    speed: true,
    throttle: true,
    brake: false,
    gear: false
  });
  
  const chartRef = useRef();

  // Mock data for demonstration - replace with actual Fast-F1 API calls
  const generateMockTelemetryData = () => {
    const timePoints = [];
    const speedData = [];
    const throttleData = [];
    const brakeData = [];
    const gearData = [];
    
    // Generate realistic F1 telemetry data for a lap
    for (let i = 0; i < 100; i++) {
      const time = i * 0.5; // 50 seconds lap time
      timePoints.push(time);
      
      // Simulate Monaco-like track with slow corners and straight sections
      let speed, throttle, brake, gear;
      
      if (i < 15) { // Straight section
        speed = 280 + Math.sin(i * 0.3) * 20;
        throttle = 95 + Math.random() * 5;
        brake = Math.random() * 5;
        gear = 7;
      } else if (i < 25) { // Braking for corner
        speed = 280 - (i - 15) * 18;
        throttle = Math.max(0, 80 - (i - 15) * 8);
        brake = Math.min(100, (i - 15) * 10);
        gear = Math.max(2, 7 - Math.floor((i - 15) / 2));
      } else if (i < 35) { // Slow corner
        speed = 100 + Math.sin((i - 25) * 0.5) * 20;
        throttle = 60 + Math.sin((i - 25) * 0.3) * 20;
        brake = Math.random() * 10;
        gear = 3;
      } else if (i < 50) { // Acceleration out of corner
        speed = 100 + (i - 35) * 8;
        throttle = Math.min(100, 40 + (i - 35) * 4);
        brake = Math.random() * 3;
        gear = Math.min(6, 3 + Math.floor((i - 35) / 3));
      } else if (i < 70) { // Another straight
        speed = 220 + Math.sin((i - 50) * 0.2) * 30;
        throttle = 90 + Math.random() * 10;
        brake = Math.random() * 2;
        gear = 6;
      } else { // Final sector
        speed = 250 - Math.abs(Math.sin((i - 70) * 0.4)) * 50;
        throttle = 70 + Math.sin((i - 70) * 0.3) * 25;
        brake = Math.random() * 15;
        gear = Math.max(4, 6 - Math.floor(Math.abs(Math.sin((i - 70) * 0.2)) * 2));
      }
      
      speedData.push(speed + Math.random() * 10 - 5);
      throttleData.push(Math.max(0, Math.min(100, throttle + Math.random() * 5 - 2.5)));
      brakeData.push(Math.max(0, Math.min(100, brake + Math.random() * 3 - 1.5)));
      gearData.push(gear);
    }
    
    return {
      time: timePoints,
      speed: speedData,
      throttle: throttleData,
      brake: brakeData,
      gear: gearData,
      lapTime: '1:23.456',
      maxSpeed: Math.max(...speedData).toFixed(1),
      avgSpeed: (speedData.reduce((a, b) => a + b, 0) / speedData.length).toFixed(1),
      topGear: Math.max(...gearData)
    };
  };

  const fetchTelemetryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would call your Fast-F1 backend API
      // const response = await axios.get(`/api/telemetry/${selectedSession}/${selectedDriver}/${selectedLap}`);
      // const data = response.data;
      
      const data = generateMockTelemetryData();
      setTelemetryData(data);
      
      // Notify parent component about data changes for Hyperspeed integration
      if (onDataChange) {
        onDataChange({
          currentSpeed: data.speed[Math.floor(data.speed.length / 2)],
          maxSpeed: parseFloat(data.maxSpeed),
          telemetryData: data
        });
      }
      
    } catch (err) {
      setError('Failed to fetch telemetry data. Please check your backend connection.');
      console.error('Telemetry fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData();
  }, [selectedDriver, selectedSession, selectedLap]);

  const toggleMetric = (metric) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#03B3C3',
        bodyColor: 'white',
        borderColor: '#03B3C3',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (seconds)',
          color: 'white'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Speed (km/h) / Throttle/Brake (%)',
          color: 'white'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y1: {
        type: 'linear',
        display: visibleMetrics.gear,
        position: 'right',
        title: {
          display: true,
          text: 'Gear',
          color: 'white'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          stepSize: 1
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };

  const chartData = {
    labels: telemetryData?.time || [],
    datasets: [
      ...(visibleMetrics.speed ? [{
        label: 'Speed (km/h)',
        data: telemetryData?.speed || [],
        borderColor: '#03B3C3',
        backgroundColor: 'rgba(3, 179, 195, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }] : []),
      ...(visibleMetrics.throttle ? [{
        label: 'Throttle (%)',
        data: telemetryData?.throttle || [],
        borderColor: '#00ff00',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }] : []),
      ...(visibleMetrics.brake ? [{
        label: 'Brake (%)',
        data: telemetryData?.brake || [],
        borderColor: '#ff0000',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }] : []),
      ...(visibleMetrics.gear ? [{
        label: 'Gear',
        data: telemetryData?.gear || [],
        borderColor: '#D856BF',
        backgroundColor: 'rgba(216, 86, 191, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y1',
        stepped: true
      }] : [])
    ]
  };

  const drivers = [
    { code: 'HAM', name: 'Hamilton' },
    { code: 'VER', name: 'Verstappen' },
    { code: 'LEC', name: 'Leclerc' },
    { code: 'RUS', name: 'Russell' },
    { code: 'PER', name: 'Perez' },
    { code: 'SAI', name: 'Sainz' },
    { code: 'NOR', name: 'Norris' },
    { code: 'PIA', name: 'Piastri' }
  ];

  const sessions = [
    { code: 'FP1', name: 'Free Practice 1' },
    { code: 'FP2', name: 'Free Practice 2' },
    { code: 'FP3', name: 'Free Practice 3' },
    { code: 'Q', name: 'Qualifying' },
    { code: 'R', name: 'Race' }
  ];

  return (
    <Container>
      <Header>
        <ChartTitle>F1 Telemetry Analysis</ChartTitle>
        <Controls>
          <Select 
            value={selectedDriver} 
            onChange={(e) => setSelectedDriver(e.target.value)}
          >
            {drivers.map(driver => (
              <option key={driver.code} value={driver.code}>
                {driver.name}
              </option>
            ))}
          </Select>
          
          <Select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            {sessions.map(session => (
              <option key={session.code} value={session.code}>
                {session.name}
              </option>
            ))}
          </Select>
          
          <Select 
            value={selectedLap} 
            onChange={(e) => setSelectedLap(e.target.value)}
          >
            <option value="fastest">Fastest Lap</option>
            <option value="1">Lap 1</option>
            <option value="10">Lap 10</option>
            <option value="20">Lap 20</option>
          </Select>
        </Controls>
      </Header>

      <Controls style={{ marginBottom: '15px' }}>
        <Button 
          active={visibleMetrics.speed}
          onClick={() => toggleMetric('speed')}
        >
          Speed
        </Button>
        <Button 
          active={visibleMetrics.throttle}
          onClick={() => toggleMetric('throttle')}
        >
          Throttle
        </Button>
        <Button 
          active={visibleMetrics.brake}
          onClick={() => toggleMetric('brake')}
        >
          Brake
        </Button>
        <Button 
          active={visibleMetrics.gear}
          onClick={() => toggleMetric('gear')}
        >
          Gear
        </Button>
      </Controls>

      {loading && <LoadingIndicator>Loading telemetry data...</LoadingIndicator>}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {telemetryData && !loading && (
        <>
          <ChartContainer>
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </ChartContainer>
          
          <StatsContainer>
            <StatBox>
              <StatLabel>Lap Time</StatLabel>
              <StatValue>{telemetryData.lapTime}</StatValue>
            </StatBox>
            <StatBox>
              <StatLabel>Max Speed</StatLabel>
              <StatValue>{telemetryData.maxSpeed} km/h</StatValue>
            </StatBox>
            <StatBox>
              <StatLabel>Avg Speed</StatLabel>
              <StatValue>{telemetryData.avgSpeed} km/h</StatValue>
            </StatBox>
            <StatBox>
              <StatLabel>Top Gear</StatLabel>
              <StatValue>{telemetryData.topGear}</StatValue>
            </StatBox>
          </StatsContainer>
        </>
      )}
    </Container>
  );
};

export default F1TimeSeries;