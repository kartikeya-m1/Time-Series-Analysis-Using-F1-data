#!/bin/bash
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
