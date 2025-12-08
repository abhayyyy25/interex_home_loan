#!/bin/bash
# Start both Python backend and Node frontend

# Start Python FastAPI backend on port 8000
echo "Starting Python FastAPI backend on port 8000..."
python3 backend/run.py &
PYTHON_PID=$!

# Wait for Python backend to be ready
sleep 3

# Start Node/Vite frontend on port 5000
echo "Starting Node frontend on port 5000..."
NODE_ENV=development tsx server/index.ts &
NODE_PID=$!

# Handle shutdown
trap "kill $PYTHON_PID $NODE_PID" EXIT

# Wait for both processes
wait
