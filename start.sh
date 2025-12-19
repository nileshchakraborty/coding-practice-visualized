#!/bin/bash

# Function to kill processes on specific ports
kill_port() {
    PORT=$1
    PID=$(lsof -t -i:$PORT)
    if [ -n "$PID" ]; then
        echo "Port $PORT is in use by PID $PID. Killing..."
        kill -9 $PID 2>/dev/null
    fi
}

# Clean start: Kill anything on our ports
kill_port 8000
kill_port 3001
kill_port 3000

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    # Avoid recursive calls
    trap - SIGINT SIGTERM EXIT
    
    echo ""
    echo "Shutting down services..."
    
    if [ -n "$BACKEND_PID" ]; then
        echo "Stopping Backend..."
        # Kill child processes (reloader)
        pkill -P $BACKEND_PID 2>/dev/null
        # Kill parent
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        echo "Stopping Frontend..."
        # Kill child processes (vite)
        pkill -P $FRONTEND_PID 2>/dev/null
        # Kill parent (npm)
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Final cleanup of ports just in case
    kill_port 8000
    kill_port 3001
    kill_port 3000
    
    exit
}

trap cleanup SIGINT SIGTERM EXIT

echo "Starting Backend (Port 3001)..."
cd api
npm start &
BACKEND_PID=$!
cd ..

# Give backend a moment to grab the socket
sleep 1

echo "Starting Frontend (Port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!

wait
