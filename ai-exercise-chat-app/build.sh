#!/bin/bash
# Build script for Vercel - injects environment variables into supabase-config.js

set -e

# Create output directory
mkdir -p .output

# Copy all src files to .output
cp -r src/* .output/

# Make sure supabase-config.js exists
if [ ! -f ".output/scripts/supabase-config.js" ]; then
  echo "❌ Error: supabase-config.js not found at .output/scripts/"
  exit 1
fi

# Replace placeholders with environment variables
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  sed -i.bak "s|https://zsswzhblrgyuvtswatsv.supabase.co|$NEXT_PUBLIC_SUPABASE_URL|g" .output/scripts/supabase-config.js
  rm -f .output/scripts/supabase-config.js.bak
  echo "✅ Updated SUPABASE_URL"
fi

if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  sed -i.bak "s|sb_publishable_VTx2f2Hnc8BRA-hHHCOMRw_gycg8Xpi|$NEXT_PUBLIC_SUPABASE_ANON_KEY|g" .output/scripts/supabase-config.js
  rm -f .output/scripts/supabase-config.js.bak
  echo "✅ Updated SUPABASE_ANON_KEY"
fi

# Verify index.html exists
if [ ! -f ".output/index.html" ]; then
  echo "❌ Error: index.html not found at .output/"
  exit 1
fi

echo "✅ Build complete - .output ready"
ls -la .output/ | head -10

