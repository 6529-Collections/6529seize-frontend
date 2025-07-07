#!/bin/bash

grep -rl 'useEffect\|useState\|useRouter\|useRef\|useReducer\|useContext' components helpers contexts hooks \
  | grep -E '\.tsx?$' \
  | while read -r file; do
    if ! grep -q '^["'\'']use client["'\'']' "$file"; then
      echo "📌 Patching: $file"
      tmpfile=$(mktemp)
      echo '"use client"' > "$tmpfile"
      echo >> "$tmpfile"
      cat "$file" >> "$tmpfile"
      mv "$tmpfile" "$file"
    fi
  done