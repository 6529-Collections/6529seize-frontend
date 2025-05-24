#!/usr/bin/env fish

# Setup environment for parallel coverage improvement (Fish shell version)
# Usage: source scripts/setup-coverage-env.fish <process_id> <total_processes>
#
# Example:
#   source scripts/setup-coverage-env.fish 0 8
#   npm run improve-coverage  # Will use PROCESS_ID=0 TOTAL_PROCESSES=8

set -l process_id_arg $argv[1]
set -l total_processes_arg $argv[2]

# Both arguments are required
if test -z "$process_id_arg" -o -z "$total_processes_arg"
    echo "Error: Both PROCESS_ID and TOTAL_PROCESSES are required" >&2
    echo "Usage: source "(status filename)" <process_id> <total_processes>" >&2
    echo "Example: source "(status filename)" 0 1  # For single process" >&2
    echo "Example: source "(status filename)" 0 8  # For process 0 of 8" >&2
    return 1
end

# Validate inputs
if not string match -qr '^[0-9]+$' -- $process_id_arg
    echo "Error: PROCESS_ID must be a non-negative integer" >&2
    return 1
end

if not string match -qr '^[1-9][0-9]*$' -- $total_processes_arg
    echo "Error: TOTAL_PROCESSES must be a positive integer" >&2
    return 1
end

if test $process_id_arg -ge $total_processes_arg
    echo "Error: PROCESS_ID ($process_id_arg) must be less than TOTAL_PROCESSES ($total_processes_arg)" >&2
    return 1
end

# Export the variables
set -gx PROCESS_ID $process_id_arg
set -gx TOTAL_PROCESSES $total_processes_arg

echo "Coverage environment configured:"
echo "  PROCESS_ID=$PROCESS_ID"
echo "  TOTAL_PROCESSES=$TOTAL_PROCESSES"
echo ""
echo "You can now run 'npm run improve-coverage' and it will use these settings."
echo "To clear these settings, run: set -e PROCESS_ID TOTAL_PROCESSES" 
