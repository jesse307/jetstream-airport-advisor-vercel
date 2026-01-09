#!/bin/bash

# Force deploy Supabase edge functions
# This script deploys the claude-autonomous-chat function to Supabase

echo "🚀 Deploying claude-autonomous-chat function..."

# Deploy the function
supabase functions deploy claude-autonomous-chat --project-ref $(supabase status | grep 'API URL' | awk '{print $NF}' | cut -d'/' -f3 | cut -d'.' -f1) --no-verify-jwt

echo "✅ Deployment complete!"
echo ""
echo "📝 Summary of changes:"
echo "  - executeCreateLead now creates accounts AND opportunities"
echo "  - System prompt updated to reflect new workflow"
echo "  - Success message shows 'Created account and opportunity'"
echo ""
echo "🧪 Test the chatbot at your application homepage"
