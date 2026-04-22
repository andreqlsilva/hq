#!/bin/sh
# build.sh - Run the full test suite.
# Add build steps (bundling, etc.) below the test block as needed.
set -e

echo "==> hq test suite"
fail=0

for f in tests/*.test.js; do
  printf "  %-36s" "$f"
  output=$(deno run --allow-read --allow-env --allow-net "$f" 2>&1)
  if [ $? -eq 0 ]; then
    echo "ok"
  else
    echo "FAIL"
    echo "$output" | sed 's/^/    /'
    fail=1
  fi
done

echo ""
[ "$fail" -eq 0 ] && echo "==> all tests passed" || { echo "==> tests failed"; exit 1; }
