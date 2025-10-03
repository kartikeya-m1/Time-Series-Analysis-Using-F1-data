# F1 Hyperspeed Dashboard

Advanced Formula 1 telemetry visualization with 3D hyperspeed effects powered by Fast-F1.

## Project Structure

```
F1-Hyperspeed-Dashboard/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS and styling
│   │   └── utils/           # Utility functions and Hyperspeed
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── backend/                  # Python Flask API
│   ├── api/                 # API endpoints
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── config/              # Configuration files
├── docs/                     # Documentation
└── scripts/                  # Build and deployment scripts
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- Fast-F1 library

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python api/f1_api.py
```

## Features
- Real-time F1 telemetry visualization
- 3D Hyperspeed effects with WebGL
- Interactive driver selection
- Speed, throttle, brake, and gear analysis
- Monaco Grand Prix track simulation

## Tech Stack
- **Frontend**: React, Three.js, Chart.js, Styled Components
- **Backend**: Flask, Fast-F1, Pandas
- **Visualization**: WebGL, PostProcessing effects
