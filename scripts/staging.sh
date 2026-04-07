#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e
set -o pipefail

# Function to print messages
print_message() {
  echo
  echo "================================================================"
  echo "$1"
  echo "================================================================"
  echo
}



# Step 1: Pull
git pull

# Step 2: Reinstall dependencies
print_message "Reinstalling dependencies..."
./bin/6529 install:frozen

# Step 3: Rebuild the project
print_message "Rebuilding the project..."
./bin/6529 run build

# Step 5: Restart PM2 services
print_message "Restarting PM2 services..."
pm2 delete 6529seize >/dev/null 2>&1 || true
pm2 start ./bin/6529 --name=6529seize -- run start:standalone
pm2 save >/dev/null 2>&1 || true

print_message "Update completed successfully!"
