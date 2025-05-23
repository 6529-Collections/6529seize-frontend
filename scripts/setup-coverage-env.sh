#!/bin/bash

# Setup environment for parallel coverage improvement
# Usage: source scripts/setup-coverage-env.sh <process_id> <total_processes>
#
# Example:
#   source scripts/setup-coverage-env.sh 0 8
#   npm run improve-coverage  # Will use PROCESS_ID=0 TOTAL_PROCESSES=8
#   npm run improve-coverage  # Still uses the same values

PROCESS_ID_ARG=$1
TOTAL_PROCESSES_ARG=$2

# Both arguments are required
if [ -z "$PROCESS_ID_ARG" ] || [ -z "$TOTAL_PROCESSES_ARG" ]; then
    echo "Error: Both PROCESS_ID and TOTAL_PROCESSES are required" >&2
    echo "Usage: source $0 <process_id> <total_processes>" >&2
    echo "Example: source $0 0 1  # For single process" >&2
    echo "Example: source $0 0 8  # For process 0 of 8" >&2
    return 1
fi

# Validate inputs
if ! [[ "$PROCESS_ID_ARG" =~ ^[0-9]+$ ]]; then
    echo "Error: PROCESS_ID must be a non-negative integer" >&2
    return 1
fi

if ! [[ "$TOTAL_PROCESSES_ARG" =~ ^[1-9][0-9]*$ ]]; then
    echo "Error: TOTAL_PROCESSES must be a positive integer" >&2
    return 1
fi

if [ "$PROCESS_ID_ARG" -ge "$TOTAL_PROCESSES_ARG" ]; then
    echo "Error: PROCESS_ID ($PROCESS_ID_ARG) must be less than TOTAL_PROCESSES ($TOTAL_PROCESSES_ARG)" >&2
    return 1
fi

# Export the variables
export PROCESS_ID=$PROCESS_ID_ARG
export TOTAL_PROCESSES=$TOTAL_PROCESSES_ARG

echo "Coverage environment configured:"
echo "  PROCESS_ID=$PROCESS_ID"
echo "  TOTAL_PROCESSES=$TOTAL_PROCESSES"
echo ""
echo "You can now run 'npm run improve-coverage' and it will use these settings."
echo "To clear these settings, run: unset PROCESS_ID TOTAL_PROCESSES" 
