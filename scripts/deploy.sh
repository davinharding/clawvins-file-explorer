#!/usr/bin/env bash
set -euo pipefail

echo "Running tests..."
if ! npm test; then
  echo "Tests failed. Aborting deploy."
  exit 1
fi

echo "Building project..."
if ! npm run build; then
  echo "Build failed. Aborting deploy."
  exit 1
fi

echo "Deploying to fileserver..."
if ! cp -r dist/* /home/node/.openclaw/workspace/.fileserver/; then
  echo "Deploy failed. Aborting deploy."
  exit 1
fi

echo "Deployed successfully."
