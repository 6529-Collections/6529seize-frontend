#!/bin/bash

# Branch to merge from (e.g., main)
SOURCE_BRANCH="$1"
# File to merge
FILE_TO_MERGE="$2"

if [ -z "$SOURCE_BRANCH" ] || [ -z "$FILE_TO_MERGE" ]; then
  echo "Usage: $0 <source_branch> <file_to_merge>"
  exit 1
fi

# Make sure the original branch is saved
ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# If we're not on the temporary branch, create one for safety
if [[ $ORIGINAL_BRANCH != temp-merge-* ]]; then
  echo "Creating a temporary branch for safe conflict resolution..."
  TEMP_BRANCH="temp-merge-file-$(date +%s)"
  git checkout -b "$TEMP_BRANCH"
else
  TEMP_BRANCH="$ORIGINAL_BRANCH"
fi

# Save the file if it exists
if [ -f "$FILE_TO_MERGE" ]; then
  BACKUP_DIR="/tmp/git-merge-backups"
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/$(basename "$FILE_TO_MERGE").backup"
  cp "$FILE_TO_MERGE" "$BACKUP_FILE"
  echo "Backed up original file to $BACKUP_FILE"
fi

# Abort any existing merge
git merge --abort 2>/dev/null || true

# Get the diff for this file to see if it even has changes
DIFF_OUTPUT=$(git diff "$SOURCE_BRANCH" -- "$FILE_TO_MERGE")
if [ -z "$DIFF_OUTPUT" ]; then
  echo "No changes detected in $FILE_TO_MERGE between branches."
  echo "No need to merge this file."
  exit 0
fi

# Start a fresh merge
echo "Starting merge with $SOURCE_BRANCH to check conflicts..."
git merge --no-commit --no-ff "$SOURCE_BRANCH" 2>/dev/null || true

# Check if this specific file is conflicted
if git ls-files --unmerged | grep -q "$FILE_TO_MERGE"; then
  echo "✅ Conflicts found in $FILE_TO_MERGE - ready to resolve"
  
  # Get list of all conflicted files
  ALL_CONFLICTS=$(git diff --name-only --diff-filter=U)
  
  # Resolve all other conflicts in favor of our version
  echo "Resolving all other conflicts to focus on just this file..."
  for OTHER_FILE in $ALL_CONFLICTS; do
    if [ "$OTHER_FILE" != "$FILE_TO_MERGE" ]; then
      echo "  - Auto-resolving: $OTHER_FILE (keeping our version)"
      git checkout --ours -- "$OTHER_FILE"
      git add "$OTHER_FILE"
    fi
  done
  
  echo ""
  echo "📝 ONLY $FILE_TO_MERGE has conflict markers now."
  echo "   Open this file in your editor to manually resolve conflicts."
  echo ""
  echo "After resolving the conflicts:"
  echo "1. Test your application"
  echo "2. Mark as resolved: git add $FILE_TO_MERGE"
  echo "3. Complete the merge: git commit"
  echo ""
  echo "⚠️ To abort and try another file: git merge --abort"
else
  # File doesn't have conflicts - it was auto-merged or doesn't exist in one branch
  echo "✨ No direct conflicts in $FILE_TO_MERGE."
  
  # Check if the file exists in the current branch
  if [ ! -f "$FILE_TO_MERGE" ]; then
    echo "File only exists in $SOURCE_BRANCH, getting a clean copy..."
    
    # Make sure the directory exists
    DIR=$(dirname "$FILE_TO_MERGE")
    mkdir -p "$DIR"
    
    # Use git show which handles new files better
    git show "$SOURCE_BRANCH:$FILE_TO_MERGE" > "$FILE_TO_MERGE" 2>/dev/null
    
    if [ $? -eq 0 ]; then
      git add "$FILE_TO_MERGE"
      echo "Added the file. You can now test your application."
      echo "Complete the merge with: git commit -m \"Added $FILE_TO_MERGE from $SOURCE_BRANCH\""
    else
      echo "Error getting file from source branch. Trying alternate method..."
      # Fallback method for new files
      git checkout "$SOURCE_BRANCH" -- "$FILE_TO_MERGE" 2>/dev/null
      
      if [ $? -eq 0 ]; then
        git add "$FILE_TO_MERGE"
        echo "Added the file using fallback method. You can now test your application."
        echo "Complete the merge with: git commit -m \"Added $FILE_TO_MERGE from $SOURCE_BRANCH\""
      else
        echo "ERROR: Could not get $FILE_TO_MERGE from $SOURCE_BRANCH."
      fi
    fi
  else
    # Show the changes for reference
    git diff "$SOURCE_BRANCH" -- "$FILE_TO_MERGE" > "/tmp/changes_$(basename "$FILE_TO_MERGE").diff"
    echo "Changes between branches saved to /tmp/changes_$(basename "$FILE_TO_MERGE").diff"
    
    # Abort merge to get back to a clean state
    git merge --abort
    
    echo "To apply changes from $SOURCE_BRANCH to this file:"
    echo "1. git checkout $SOURCE_BRANCH -- $FILE_TO_MERGE"
    echo "2. Test your application"
    echo "3. git add $FILE_TO_MERGE"
    echo "4. git commit -m \"Updated $FILE_TO_MERGE from $SOURCE_BRANCH\""
  fi
fi