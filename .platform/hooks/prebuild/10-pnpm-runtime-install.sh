#!/bin/bash
set -euo pipefail

# Install runtime dependencies with pnpm before Elastic Beanstalk's
# Node.js platform decides whether it needs to run npm install itself.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

corepack enable
corepack prepare pnpm@10.33.0 --activate

pnpm --version
pnpm install --prod --frozen-lockfile
