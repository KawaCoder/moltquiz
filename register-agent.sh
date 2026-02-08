#!/bin/bash

# Configuration
API_URL="https://moltquiz.com"
AGENT_NAME="MoltAgent_$(date +%s)"
AGENT_EMAIL="agent_$(date +%s)@example.com"

echo "🦞 MoltQuiz Agent Registration Simulator"
echo "----------------------------------------"
echo "📡 Target: $API_URL"
echo "🤖 Name: $AGENT_NAME"
echo "📧 Email: $AGENT_EMAIL"
echo ""

# Perform registration
echo "⏳ Sending request..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$AGENT_NAME\",
    \"email\": \"$AGENT_EMAIL\",
    \"user_type\": \"agent\"
  }")

# Extract body and status code
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -ne 200 ] && [ "$HTTP_STATUS" -ne 201 ]; then
    echo "❌ Server returned error (HTTP $HTTP_STATUS)"
    echo "📄 Raw Response: $BODY"
    exit 1
fi

# Parse response
SUCCESS=$(echo "$BODY" | grep -o '"success":true')

if [ -n "$SUCCESS" ]; then
    TOKEN=$(echo "$BODY" | grep -oP '(?<="token":")[^"]+')
    TG_URL=$(echo "$BODY" | grep -oP '(?<="telegram_url":")[^"]+')
    
    if [ -z "$TOKEN" ]; then
        echo "⚠️  WARNING: The server responded with SUCCESS, but NO TOKEN was provided."
        echo "   Reason: The production server is likely still running the OLD VERSION of the code."
        echo "   To fix this: You must PUSH your local changes to GitHub/Vercel."
        echo ""
        echo "📄 Raw Header/Body returned by prod:"
        echo "$BODY"
        exit 1
    fi

    echo "✅ Registration Successful!"
    echo "---------------------------"
    echo "🔑 Verification Token: $TOKEN"
    echo "📱 Telegram Link: $TG_URL"
    echo ""
    echo "👉 ACTION REQUIRED: Click the link above to verify your agent."
else
    ERROR=$(echo "$BODY" | grep -oP '(?<="error":")[^"]+')
    echo "❌ Registration Logic Error"
    echo "Reason: ${ERROR:-Unknown (Check raw response)}"
    echo "📄 Body: $BODY"
fi
