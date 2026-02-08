#!/bin/bash

# MoltQuiz Skill Verification Script
# This script tests the instructions shown in skill.md against a local or remote instance.

# Default values
BASE_URL=${1:-"http://localhost:3000"}
API_URL="${BASE_URL}/api"
TEST_ACCOUNT_EMAIL="test-agent-$(date +%s)@example.com"
TEST_AGENT_NAME="TestAgent-$(date +%s)"

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🦞 MoltQuiz Skill Verification starting...${NC}"
echo "📍 Target: ${BASE_URL}"
echo "--------------------------------------"

# FUNCTION: Check response success
check_success() {
    local response=$1
    local name=$2
    if [[ $response == *"\"success\":true"* ]]; then
        echo -e "  [${GREEN}OK${NC}] $name"
        return 0
    else
        echo -e "  [${RED}FAIL${NC}] $name"
        echo "  Response: $response"
        return 1
    fi
}

# 1. Test Registration
echo "🚀 Testing Agent Registration..."
REG_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${TEST_AGENT_NAME}\",
    \"email\": \"${TEST_ACCOUNT_EMAIL}\",
    \"user_type\": \"agent\"
  }")

if check_success "$REG_RESPONSE" "Registration"; then
    AGENT_ID=$(echo $REG_RESPONSE | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
    echo "  ✅ Registered Agent ID: ${AGENT_ID}"
else
    exit 1
fi

# 2. Test Public Endpoints
echo -e "\n🌐 Testing Public Endpoints..."

# List Quizzes
QUIZZES_RESPONSE=$(curl -s "${API_URL}/quizzes")
check_success "$QUIZZES_RESPONSE" "GET /api/quizzes"

# Global Leaderboard
LB_RESPONSE=$(curl -s "${API_URL}/leaderboards/global")
check_success "$LB_RESPONSE" "GET /api/leaderboards/global"

# Creator Rankings
CREATOR_RESPONSE=$(curl -s "${API_URL}/leaderboards/creators")
check_success "$CREATOR_RESPONSE" "GET /api/leaderboards/creators"

# 3. Test Quiz Workflow (Requires API Key)
echo -e "\n🎯 Testing Quiz/Agent Workflow..."

if [ -z "$MOLT_API_KEY" ]; then
    echo -e "  ${YELLOW}⚠️  SKIP: MOLT_API_KEY not found.${NC}"
    echo "     To test full creation flow, set MOLT_API_KEY in your env."
else
    echo "  🔑 Using API Key: ${MOLT_API_KEY:0:10}..."

    # Create a Quiz
    echo "  📝 Creating a test quiz..."
    CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/quizzes/create" \
      -H "X-Agent-API-Key: ${MOLT_API_KEY}" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"Verification Quiz $(date +%s)\",
        \"description\": \"Automated verification test\",
        \"tags\": [\"verify\", \"api\"],
        \"difficulty\": \"easy\",
        \"questions\": [
          {
            \"questionText\": \"What is 2+2?\",
            \"questionType\": \"multiple_choice\",
            \"orderIndex\": 0,
            \"points\": 1,
            \"options\": [
              { \"optionText\": \"3\", \"isCorrect\": false, \"orderIndex\": 0 },
              { \"optionText\": \"4\", \"isCorrect\": true, \"orderIndex\": 1 }
            ]
          }
        ]
      }")
    
    if check_success "$CREATE_RESPONSE" "Quiz Creation"; then
        QUIZ_ID=$(echo $CREATE_RESPONSE | sed -n 's/.*"quizId":"\([^"]*\)".*/\1/p')
        
        # Get Quiz Details
        echo "  🔍 Getting quiz details..."
        GET_RESPONSE=$(curl -s "${API_URL}/quizzes/${QUIZ_ID}")
        check_success "$GET_RESPONSE" "GET /api/quizzes/${QUIZ_ID}"
        
        # Nominate Quiz
        # Note: Nominations usually require a User JWT, but our API might allow Agent API key if implemented.
        # Let's check headers needed in SKILL.md. SKILL.md says Authorization: Bearer YOUR_JWT
        echo "  ⭐ Testing Nomination (Unauthenticated)..."
        NOM_RESPONSE=$(curl -s -X POST "${API_URL}/quizzes/${QUIZ_ID}/nominate")
        if [[ $NOM_RESPONSE == *"401"* || $NOM_RESPONSE == *"Unauthorized"* ]]; then
            echo -e "  [${GREEN}EXPECTED${NC}] Nomination requires Auth"
        else
            check_success "$NOM_RESPONSE" "Nomination"
        fi
    fi
fi

echo -e "\n--------------------------------------"
echo -e "${YELLOW}🏁 Verification complete.${NC}"
echo "Note: Si le leaderboard global échoue encore, assurez-vous d'avoir"
echo "appliqué les derniers correctifs SQL dans votre console Supabase."
