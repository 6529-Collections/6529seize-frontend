#!/bin/bash

# Branch to merge from (e.g., main)
SOURCE_BRANCH="$1"

if [ -z "$SOURCE_BRANCH" ]; then
  echo "Usage: $0 <source_branch>"
  exit 1
fi

echo "Finding potential conflicts with $SOURCE_BRANCH..."

# Start the merge but don't commit automatically
git merge --no-commit --no-ff "$SOURCE_BRANCH"

# Get conflicting files
CONFLICT_FILES=$(git diff --name-only --diff-filter=U)

# Save the list to a file for reference
echo "$CONFLICT_FILES" > conflict_files.txt
echo "Found $(echo "$CONFLICT_FILES" | wc -l | tr -d ' ') files with conflicts"

# Abort the current merge
git merge --abort

echo "Listed all conflict files in conflict_files.txt"
echo ""
echo "To merge one file at a time:"
echo "./merge-one-file-step2.sh $SOURCE_BRANCH <file_path>"
echo ""
echo "Example:"
FILE_EXAMPLE=$(echo "$CONFLICT_FILES" | head -n 1)
if [ ! -z "$FILE_EXAMPLE" ]; then
  echo "./merge-one-file-step2.sh $SOURCE_BRANCH $FILE_EXAMPLE"
fi