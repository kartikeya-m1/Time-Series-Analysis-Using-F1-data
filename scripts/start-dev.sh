#!/bin/bash
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
