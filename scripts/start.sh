#!/bin/bash

# Check if being run with sh instead of sourced
if [ "$0" = "sh" ] || [[ "$0" == *"/sh" ]]; then
    echo "Error: This script must be sourced to set environment variables"
    echo "Usage: source scripts/start.sh <process_id>"
    echo "Example: source scripts/start.sh 0"
    exit 1
fi

# Check if argument is provided
if [ -z "$1" ]; then
    echo "Error: Process ID required (0-7)"
    echo "Usage: source scripts/start.sh <process_id>"
    echo "Example: source scripts/start.sh 0"
    return 1
fi

PROCESS_ID_ARG=$1

# Validate process ID is 0-7
if ! [[ "$PROCESS_ID_ARG" =~ ^[0-7]$ ]]; then
    echo "Error: Process ID must be between 0 and 7"
    return 1
fi

# Set environment variables silently
export PROCESS_ID=$PROCESS_ID_ARG
export TOTAL_PROCESSES=8

# Display the coverage prompt
cat scripts/coverage_prompt.md

# Final instruction
echo ""
echo "=================================================================================="
echo "IF YOU HAVE READ ALL THIS AND UNDERSTAND THE TASK, GET YOUR FIRST TASK BY RUNNING:"
echo "npm run improve-coverage"
echo "==================================================================================" 
