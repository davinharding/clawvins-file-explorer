#!/usr/bin/env bash
set -euo pipefail
# Run dependency audit and open PRs for safe patch bumps.
npm audit --json > /tmp/audit.json || true
node scripts/triage-audit.js /tmp/audit.json
