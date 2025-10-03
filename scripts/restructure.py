#!/usr/bin/env python3
"""
Script to restructure F1 Dashboard project
"""
import os
import shutil
from pathlib import Path

# Define source and target paths
OLD_PATH = r"e:\D Drive\Semester-7\Advanced Topics in Machine Learning\Final Project\f1-dashboard"
NEW_PATH = r"e:\D Drive\Semester-7\Advanced Topics in Machine Learning\Final Project\F1-Hyperspeed-Dashboard"

# File mapping for reorganization
file_mappings = {
    # Frontend React files
    f"{OLD_PATH}/src/App.js": f"{NEW_PATH}/frontend/src/App.js",
    f"{OLD_PATH}/src/Hyperspeed.js": f"{NEW_PATH}/frontend/src/utils/Hyperspeed.js",
    f"{OLD_PATH}/src/Hyperspeed.css": f"{NEW_PATH}/frontend/src/styles/Hyperspeed.css",
    f"{OLD_PATH}/src/hyperspeedPresets.js": f"{NEW_PATH}/frontend/src/utils/hyperspeedPresets.js",
    
    # Components
    f"{OLD_PATH}/src/components/F1DataPanel.js": f"{NEW_PATH}/frontend/src/components/F1DataPanel.js",
    f"{OLD_PATH}/src/components/F1TimeSeries.js": f"{NEW_PATH}/frontend/src/components/F1TimeSeries.js",
    
    # Services
    f"{OLD_PATH}/src/services/F1DataService.js": f"{NEW_PATH}/frontend/src/services/F1DataService.js",
    
    # Backend files
    f"{OLD_PATH}/backend/f1_api.py": f"{NEW_PATH}/backend/api/f1_api.py",
    f"{OLD_PATH}/backend/requirements.txt": f"{NEW_PATH}/backend/requirements.txt",
    f"{OLD_PATH}/backend/start_backend.py": f"{NEW_PATH}/backend/start_backend.py",
    
    # Public files (favicon, manifest, etc.)
    f"{OLD_PATH}/public/favicon.ico": f"{NEW_PATH}/frontend/public/favicon.ico",
    f"{OLD_PATH}/public/manifest.json": f"{NEW_PATH}/frontend/public/manifest.json",
    f"{OLD_PATH}/public/robots.txt": f"{NEW_PATH}/frontend/public/robots.txt",
}

# Additional config files to create
config_files = {
    f"{NEW_PATH}/README.md": """# F1 Hyperspeed Dashboard

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
""",

    f"{NEW_PATH}/.gitignore": """# Dependencies
node_modules/
*/node_modules/

# Production builds  
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# FastF1 Cache
fastf1_cache/
*.cache

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
""",

    f"{NEW_PATH}/backend/requirements.txt": """flask>=2.3.0
flask-cors>=4.0.0
fastf1>=3.6.0
pandas>=2.0.0
numpy>=1.24.0
requests>=2.31.0
python-dateutil>=2.8.0
matplotlib>=3.7.0
""",

    f"{NEW_PATH}/backend/config/settings.py": """\"\"\"
Backend configuration settings
\"\"\"
import os

class Config:
    # Flask settings
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # CORS settings
    CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3001"]
    
    # Fast-F1 settings
    CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'cache')
    
    # API settings
    API_VERSION = "v1"
    API_PREFIX = f"/api/{API_VERSION}"
    
    # Default F1 settings
    DEFAULT_SEASON = 2024
    DEFAULT_EVENT = "Monaco Grand Prix"
    DEFAULT_SESSION = "Q"
""",

    f"{NEW_PATH}/scripts/start-dev.sh": """#!/bin/bash
# Start development environment

echo "Starting F1 Hyperspeed Dashboard development environment..."

# Start backend
cd backend
echo "Starting Flask backend on port 5000..."
python api/f1_api.py &
BACKEND_PID=$!

# Start frontend
cd ../frontend  
echo "Starting React frontend on port 3000..."
npm start &
FRONTEND_PID=$!

# Wait for user input to stop
echo "Press any key to stop both servers..."
read -n 1

# Kill processes
kill $BACKEND_PID $FRONTEND_PID
echo "Stopped development servers."
""",

    f"{NEW_PATH}/scripts/build.sh": """#!/bin/bash
# Production build script

echo "Building F1 Hyperspeed Dashboard for production..."

# Build frontend
cd frontend
echo "Building React frontend..."
npm run build

# Copy backend files to production directory  
cd ../
echo "Preparing backend for production..."
mkdir -p dist/backend
cp -r backend/* dist/backend/

echo "Production build complete!"
echo "Frontend build: dist/frontend"
echo "Backend files: dist/backend"
""",
}

def copy_file_content(src_path, dst_path):
    """Copy file content from src to dst, creating directories as needed"""
    try:
        # Create destination directory if it doesn't exist
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        
        # Read source file and write to destination
        with open(src_path, 'r', encoding='utf-8') as src:
            content = src.read()
            
        with open(dst_path, 'w', encoding='utf-8') as dst:
            dst.write(content)
            
        print(f"✓ Copied: {os.path.basename(src_path)} -> {dst_path}")
        return True
    except Exception as e:
        print(f"✗ Failed to copy {src_path}: {e}")
        return False

def create_config_file(path, content):
    """Create a new config file"""
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Created: {os.path.basename(path)}")
        return True
    except Exception as e:
        print(f"✗ Failed to create {path}: {e}")
        return False

def main():
    print("🏎️  F1 Dashboard Restructuring Script")
    print("=" * 50)
    
    # Copy existing files
    print("\\n📁 Copying files to new structure...")
    copied_files = 0
    for src, dst in file_mappings.items():
        if os.path.exists(src):
            if copy_file_content(src, dst):
                copied_files += 1
        else:
            print(f"⚠️  Source file not found: {src}")
    
    # Create config files
    print("\\n📄 Creating configuration files...")  
    created_files = 0
    for path, content in config_files.items():
        if create_config_file(path, content):
            created_files += 1
    
    # Summary
    print("\\n" + "=" * 50)
    print(f"📊 Restructuring Summary:")
    print(f"   Files copied: {copied_files}/{len(file_mappings)}")
    print(f"   Config files created: {created_files}/{len(config_files)}")
    print("\\n🎯 Project successfully restructured!")
    print(f"📍 New location: {NEW_PATH}")
    
    # Next steps
    print("\\n🚀 Next steps:")
    print("   1. cd F1-Hyperspeed-Dashboard/frontend && npm install")
    print("   2. cd ../backend && pip install -r requirements.txt")
    print("   3. Run ./scripts/start-dev.sh to start development environment")

if __name__ == "__main__":
    main()