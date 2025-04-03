#!/bin/bash

# Find all TypeScript files that import QueryKey from ReactQueryWrapper
find . -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "import.*QueryKey.*from.*ReactQueryWrapper" | while read -r file; do
  # Replace import statements
  if grep -q "import { QueryKey } from \".*ReactQueryWrapper\"" "$file"; then
    sed -i '' 's/import { QueryKey } from ".*ReactQueryWrapper"/import { QueryKey } from "..\/..\/components\/react-query-wrapper\/utils\/query-keys"/g' "$file"
  elif grep -q "import {.*QueryKey.*} from \".*ReactQueryWrapper\"" "$file"; then
    # Complex replacement for multi-import lines
    sed -i '' 's/import {/import {/g; s/QueryKey,//g; s/} from ".*ReactQueryWrapper"/} from "..\/..\/components\/react-query-wrapper\/ReactQueryWrapper"\nimport { QueryKey } from "..\/..\/components\/react-query-wrapper\/utils\/query-keys"/g' "$file"
  fi
done

echo "Imports updated!"