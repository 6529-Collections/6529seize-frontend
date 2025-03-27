#!/bin/bash

# Branch to merge from (e.g., main)
SOURCE_BRANCH="$1"

if [ -z "$SOURCE_BRANCH" ]; then
  echo "Usage: $0 <source_branch>"
  exit 1
fi

# Make sure we start clean
git merge --abort 2>/dev/null || true

echo "Finding changes between current branch and $SOURCE_BRANCH..."

# Find all files that would be changed in the merge
ALL_CHANGED_FILES=$(git diff --name-status "$SOURCE_BRANCH" | sort)
echo "$ALL_CHANGED_FILES" > all_changes.txt

# Start a temporary branch for testing
TEMP_BRANCH="temp-merge-$(date +%s)"
git checkout -b "$TEMP_BRANCH"

# Try the merge to see which files conflict
echo "Testing merge to identify conflicts..."
if git merge --no-commit --no-ff "$SOURCE_BRANCH" 2>/dev/null; then
  echo "No conflicts detected! This is a clean merge."
  echo "Completing the merge..."
  git commit -m "Merged $SOURCE_BRANCH with no conflicts"
  exit 0
fi

# Get conflicting files
CONFLICT_FILES=$(git diff --name-only --diff-filter=U)
echo "$CONFLICT_FILES" > conflict_files.txt
CONFLICT_COUNT=$(echo "$CONFLICT_FILES" | grep -v "^$" | wc -l | tr -d ' ')

echo "Found $CONFLICT_COUNT files with conflicts"

# Abort the merge to start fresh
git merge --abort

# Create arrays of different file types for a cleaner approach
declare -a NEW_FILES
declare -a MODIFIED_FILES
declare -a CONFLICTING_FILES

# Parse each changed file
while IFS= read -r line; do
  if [[ "$line" == A* ]]; then  # Added files
    file=$(echo "$line" | cut -f2)
    NEW_FILES+=("$file")
  elif [[ "$line" == M* ]]; then  # Modified files
    file=$(echo "$line" | cut -f2)
    if echo "$CONFLICT_FILES" | grep -q "^$file$"; then
      CONFLICTING_FILES+=("$file")
    else
      MODIFIED_FILES+=("$file")
    fi
  fi
done < <(git diff --name-status "$SOURCE_BRANCH")

# Start fresh
git checkout "$TEMP_BRANCH"

# Add all new files first (these shouldn't conflict)
echo "Adding ${#NEW_FILES[@]} new files from $SOURCE_BRANCH..."

# Debugging output to see what's happening
echo "DEBUG: New files:"
for file in "${NEW_FILES[@]}"; do
  echo "  - $file"
done

# We need to handle new files differently since they don't exist yet
for file in "${NEW_FILES[@]}"; do
  echo "Processing new file: $file"
  # Check if the file exists in conflict list
  if ! echo "$CONFLICT_FILES" | grep -q "^$file$"; then
    # Use a more direct approach to fetch new files
    dir=$(dirname "$file")
    # Make sure directory exists
    mkdir -p "$dir"
    # Directly get the file from the source branch
    git show "$SOURCE_BRANCH:$file" > "$file" 2>/dev/null
    if [ $? -eq 0 ]; then
      git add "$file"
      echo "Added new file: $file"
    else
      echo "Error getting file from source branch: $file"
    fi
  else
    echo "Skip new conflicting file: $file"
  fi
done

# Add all modified files that don't conflict
echo "Adding ${#MODIFIED_FILES[@]} modified files without conflicts..."
for file in "${MODIFIED_FILES[@]}"; do
  git checkout "$SOURCE_BRANCH" -- "$file"
  git add "$file"
  echo "Added modified file: $file"
done

echo ""
echo "Added all non-conflicting changes."
echo "Conflicting files (${#CONFLICTING_FILES[@]}) have been left untouched:"
for file in "${CONFLICTING_FILES[@]}"; do
  echo "- $file"
done

echo ""
echo "You can now:"
echo "1. Test your application with these non-conflicting changes"
echo "2. If everything works, commit these changes:"
echo "   git commit -m \"Added non-conflicting changes from $SOURCE_BRANCH\""
echo ""
echo "3. Then handle conflicts one by one using:"
echo "   ./merge-one-file-step2.sh $SOURCE_BRANCH <file_path>"
echo ""
echo "To discard all changes and start over:"
echo "   git checkout 2604-6 && git branch -D $TEMP_BRANCH"