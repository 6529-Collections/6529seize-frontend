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
pnpm install --frozen-lockfile

# Step 3: Rebuild the project
print_message "Rebuilding the project..."
pnpm run build

# Step 5: Restart PM2 services
print_message "Restarting PM2 services..."
pnpm exec pm2 restart 6529seize --update-env

print_message "Update completed successfully!"
