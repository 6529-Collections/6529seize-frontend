#!/bin/bash

# Run improve-coverage.js in parallel across multiple processes
# Usage: ./improve-coverage-parallel.sh [number_of_processes]

PROCESSES=${1:-8}

echo "Starting $PROCESSES parallel coverage improvement processes..."
echo "Each process will work on different files using hash-based assignment"
echo ""

# Start all processes in background
for ((i=0; i<$PROCESSES; i++)); do
    echo "Starting process $i of $PROCESSES..."
    PROCESS_ID=$i TOTAL_PROCESSES=$PROCESSES npm run improve-coverage &
    PIDS[$i]=$!
done

echo ""
echo "All processes started. Waiting for completion..."
echo "Process IDs: ${PIDS[@]}"
echo ""

# Wait for all processes to complete
for pid in ${PIDS[@]}; do
    wait $pid
    EXIT_CODE=$?
    echo "Process $pid completed with exit code $EXIT_CODE"
done

echo ""
echo "All coverage improvement processes have completed!" 
