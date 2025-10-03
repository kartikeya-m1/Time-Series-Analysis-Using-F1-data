# F1 Hyperspeed Dashboard - Project Structure

## 🏎️ Overview
Advanced Formula 1 telemetry visualization dashboard with 3D hyperspeed effects, powered by Fast-F1 and Three.js.

## 📁 Project Structure

```
F1-Hyperspeed-Dashboard/
├── frontend/                          # React Frontend Application
│   ├── public/                        # Static Assets
│   │   ├── index.html                # Main HTML template
│   │   ├── manifest.json             # PWA manifest
│   │   ├── favicon.ico               # App icon
│   │   └── robots.txt                # Search engine directives
│   ├── src/                          # Source Code
│   │   ├── components/               # React Components
│   │   │   ├── F1DataPanel.js       # Driver selection and session data
│   │   │   └── F1TimeSeries.js      # Telemetry chart visualization
│   │   ├── services/                 # API Services
│   │   │   └── F1DataService.js     # F1 data fetching and processing
│   │   ├── styles/                   # Styling Files
│   │   │   ├── index.css            # Global styles
│   │   │   └── Hyperspeed.css       # 3D effect styles
│   │   ├── utils/                    # Utility Functions
│   │   │   ├── Hyperspeed.js        # 3D WebGL visualization
│   │   │   └── hyperspeedPresets.js # Effect presets
│   │   ├── App.js                    # Main application component
│   │   └── index.js                  # React entry point
│   └── package.json                  # Frontend dependencies
│
├── backend/                          # Python Flask API
│   ├── api/                          # API Endpoints
│   │   └── f1_api.py                # Main API server
│   ├── services/                     # Business Logic (future)
│   ├── utils/                        # Utility Functions (future)
│   ├── config/                       # Configuration
│   │   └── settings.py              # App configuration
│   ├── requirements.txt              # Python dependencies
│   └── start_backend.py             # Backend startup script
│
├── docs/                             # Documentation
│   └── README.md                     # This file
│
├── scripts/                          # Automation Scripts
│   ├── restructure.py               # Project restructuring script
│   ├── start-dev.sh                 # Development environment startup
│   └── build.sh                     # Production build script
│
├── .gitignore                        # Git ignore rules
└── README.md                         # Main project README
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+)
- **Python** (3.8+)
- **Git**

### Development Setup

1. **Clone and Navigate**
   ```bash
   cd F1-Hyperspeed-Dashboard
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   ➡️ Frontend runs on http://localhost:3000

3. **Setup Backend**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   python api/f1_api.py
   ```
   ➡️ Backend runs on http://localhost:5000

### One-Command Start (Linux/Mac)
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

## 🔧 Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Three.js** - 3D WebGL graphics
- **Chart.js** - Interactive telemetry charts
- **Styled Components** - CSS-in-JS styling
- **Axios** - HTTP client

### Backend
- **Flask** - Python web framework
- **Fast-F1** - Formula 1 data library
- **Pandas** - Data processing
- **NumPy** - Numerical computing

### 3D Graphics
- **WebGL** - Hardware-accelerated graphics
- **PostProcessing** - Visual effects
- **Custom Shaders** - Hyperspeed effects

## ⚡ Key Features

### 🏁 F1 Data Integration
- Real-time telemetry visualization
- Driver selection and comparison
- Session data (Practice, Qualifying, Race)
- Monaco Grand Prix circuit simulation

### 🌌 3D Hyperspeed Effects
- WebGL-powered tunnel visualization
- Speed-responsive particle effects
- Dynamic color transitions
- Interactive mouse controls

### 📊 Data Visualization
- Speed, throttle, brake, gear charts
- Interactive Chart.js integration
- Driver-specific performance metrics
- Real-time chart updates

### 🎮 User Experience
- Keyboard shortcuts (H, T, ESC)
- Responsive design
- Smooth animations
- Professional F1 styling

## 🛠️ Development Notes

### Folder Organization
- **Components**: Reusable React components
- **Services**: API integration and data processing  
- **Utils**: Helper functions and 3D effects
- **Styles**: Global and component-specific CSS

### Code Quality
- ESLint configured for React
- Consistent import paths
- Modular component structure
- Clean separation of concerns

### Performance
- Component lazy loading
- Efficient 3D rendering
- Optimized bundle size
- Fast development reload

## 📦 Build & Deployment

### Production Build
```bash
# Frontend
cd frontend && npm run build

# Backend
cd ../backend && python -c "import flask; print('Backend ready for production')"
```

### Docker Deployment (Future)
```dockerfile
# Multi-stage build for production deployment
FROM node:16 AS frontend-build
# ... frontend build steps

FROM python:3.9 AS backend
# ... backend setup steps
```

## 🔄 Migration from Old Structure

The project was restructured from:
```
f1-dashboard/          →  F1-Hyperspeed-Dashboard/
├── src/               →  ├── frontend/src/
├── backend/           →  ├── backend/
└── public/            →  ├── frontend/public/
                          ├── docs/
                          └── scripts/
```

**Benefits:**
- ✅ Clear separation of frontend/backend
- ✅ Better organization of utilities and styles
- ✅ Professional project structure
- ✅ Easier deployment and scaling
- ✅ Improved development workflow

## 🎯 Next Steps

### Immediate
1. Test both frontend and backend startup
2. Verify all imports work correctly
3. Ensure 3D effects render properly

### Future Enhancements
- Docker containerization
- CI/CD pipeline setup
- Real F1 data integration
- Multi-track support
- Driver comparison tools

---

**🏎️ Ready to experience Formula 1 like never before!**