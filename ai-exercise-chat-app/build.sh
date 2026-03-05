#!/bin/bash
# Build script for Vercel - injects environment variables into supabase-config.js

mkdir -p .output
cp -r src/* .output/

# Replace placeholders in supabase-config.js with env vars
sed -i "s|https://zsswzhblrgyuvtswatsv.supabase.co|${NEXT_PUBLIC_SUPABASE_URL:-https://zsswzhblrgyuvtswatsv.supabase.co}|g" .output/scripts/supabase-config.js
sed -i "s|sb_publishable_VTx2f2Hnc8BRA-hHHCOMRw_gycg8Xpi|${NEXT_PUBLIC_SUPABASE_ANON_KEY:-sb_publishable_VTx2f2Hnc8BRA-hHHCOMRw_gycg8Xpi}|g" .output/scripts/supabase-config.js

echo "✅ Build complete"
