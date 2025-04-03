#!/bin/bash

ORIGINAL_BRANCH="2604-6"  # Your original branch

echo "Aborting any in-progress merge..."
git merge --abort 2>/dev/null || true

echo "Cleaning up temporary files..."
rm -f /tmp/conflict_files_list.txt
rm -f /tmp/changes_*.diff
rm -f conflict_files.txt
rm -f added_files.txt
rm -f modified_files.txt
rm -f all_changes.txt

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ $CURRENT_BRANCH == temp-merge-* ]]; then
  echo "Currently on temporary branch $CURRENT_BRANCH"
  echo "Switching back to $ORIGINAL_BRANCH..."
  git checkout "$ORIGINAL_BRANCH"
  echo "Deleting temporary branch..."
  git branch -D "$CURRENT_BRANCH"
fi

echo "✅ Merge aborted successfully. You can start fresh."
echo ""
echo "Options:"
echo "1. Merge non-conflicting files first: ./merge-non-conflicts.sh main"
echo "2. Merge one specific file: ./merge-one-file-step2.sh main path/to/file"
echo ""
echo "Recommended workflow:"
echo "1. Start with ./merge-non-conflicts.sh main to handle all non-conflicting files"
echo "2. Then for each conflict, use ./merge-one-file-step2.sh main path/to/file"