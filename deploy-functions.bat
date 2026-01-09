@echo off
echo.
echo ========================================
echo   Deploying Supabase Edge Functions
echo ========================================
echo.

echo Deploying claude-autonomous-chat...
supabase functions deploy claude-autonomous-chat

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Summary of changes:
echo   - executeCreateLead now creates accounts AND opportunities
echo   - System prompt updated to reflect new workflow
echo   - Success message shows 'Created account and opportunity'
echo.
echo Test the chatbot at your application homepage
echo.
pause
