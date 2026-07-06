#!/bin/sh
# =============================================================================
# docker-entrypoint.sh
#
# Starts the GPT Coffee mock API server in the background, then hands off
# to the Playwright test runner.
#
# The mock server runs on port 4100 (matches VITE_API_URL / API_BASE in
# App.tsx).  Playwright's webServer config handles starting the Vite dev
# server on port 5174.
# =============================================================================

set -e

echo "[entrypoint] Starting GPT Coffee mock API server..."
node /app/.codevalid/ui/mock/mock-server.js &
MOCK_PID=$!

# Give the mock server a moment to bind its port before Playwright starts
sleep 1

echo "[entrypoint] Mock API server started (PID $MOCK_PID)"
echo "[entrypoint] Running: npx playwright test --config .codevalid/ui/playwright.config.js"

# Execute Playwright; capture exit code so we can shut down the mock server
set +e
npx playwright test --config .codevalid/ui/playwright.config.js "$@"
PLAYWRIGHT_EXIT=$?
set -e

echo "[entrypoint] Playwright exited with code $PLAYWRIGHT_EXIT"

# Shut down the mock server
kill $MOCK_PID 2>/dev/null || true
wait $MOCK_PID 2>/dev/null || true

exit $PLAYWRIGHT_EXIT
