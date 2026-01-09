#!/bin/bash

# Deploy the claude-autonomous-chat Edge Function
# Make sure you have the Supabase CLI installed and are logged in

echo "Deploying claude-autonomous-chat Edge Function..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Deploy the function
supabase functions deploy claude-autonomous-chat --project-ref hwemookrxvflpinfpkrj

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the chatbot at your home page"
echo "2. Try: 'Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, light and superlight'"
echo "3. Check the database to verify lead creation"
