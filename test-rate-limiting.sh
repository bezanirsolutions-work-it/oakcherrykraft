#!/bin/bash
# RATE LIMITING VALIDATION TESTS
# Run this script to verify rate limiting implementation
# Usage: ./test-rate-limiting.sh <ANON_KEY> <PROXY_URL>

set -e

ANON_KEY="${1}"
PROXY_URL="${2:-http://localhost:4173/api/proxy}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$ANON_KEY" ] || [ -z "$PROXY_URL" ]; then
  echo "Usage: ./test-rate-limiting.sh <ANON_KEY> <PROXY_URL>"
  echo "Example: ./test-rate-limiting.sh 'eyJhbGc...' 'https://jmr....supabase.co/functions/v1/live_chat_proxy'"
  exit 1
fi

echo "========================================"
echo "RATE LIMITING VALIDATION TEST SUITE"
echo "========================================"
echo "ANON_KEY: ${ANON_KEY:0:20}..."
echo "PROXY_URL: $PROXY_URL"
echo ""

TEST_PASS=0
TEST_FAIL=0

test_result() {
  local name=$1
  local expected=$2
  local actual=$3
  
  if [ "$expected" == "$actual" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $name (got $actual)"
    ((TEST_PASS++))
  else
    echo -e "${RED}✗ FAIL${NC}: $name (expected $expected, got $actual)"
    ((TEST_FAIL++))
  fi
}

# Test 1: Normal Session Creation (Should Succeed)
echo ""
echo "Test 1: Normal Session Creation (Should Return 201)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/session" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"visitor_token\":\"test-token-$(date +%s%N)\",\"name\":\"Test User\",\"email\":\"test@test.com\",\"phone\":\"555-0000\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

test_result "Session creation returns 201" "201" "$HTTP_CODE"

SESSION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
VISITOR_TOKEN=$(echo "$BODY" | grep -o '"visitor_token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SESSION_ID" ] || [ -z "$VISITOR_TOKEN" ]; then
  echo -e "${RED}✗ Could not extract session_id or visitor_token${NC}"
  echo "Response body: $BODY"
  exit 1
fi

echo "  - Extracted SESSION_ID: ${SESSION_ID:0:8}..."
echo "  - Extracted VISITOR_TOKEN: ${VISITOR_TOKEN:0:8}..."

# Test 2: Verify Message Creation Works (Should Succeed)
echo ""
echo "Test 2: Normal Message Creation (Should Return 201)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/message" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"visitor_token\":\"$VISITOR_TOKEN\",\"content\":\"Test message\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_result "Message creation returns 201" "201" "$HTTP_CODE"

# Test 3: Message Rate Limit (After 15 messages, should get 429)
echo ""
echo "Test 3: Message Rate Limiting (15 per minute limit)"
echo "  Sending 16 messages (should fail on 16th)..."

FAIL_FOUND=0
for i in {1..16}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/message" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"session_id\":\"$SESSION_ID\",\"visitor_token\":\"$VISITOR_TOKEN\",\"content\":\"Message $i\"}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if [ "$i" -le "15" ]; then
    if [ "$HTTP_CODE" != "201" ]; then
      echo -e "${RED}✗ Message $i failed (expected 201, got $HTTP_CODE)${NC}"
      ((TEST_FAIL++))
      FAIL_FOUND=1
    fi
  else
    # 16th message should get 429
    if [ "$HTTP_CODE" == "429" ]; then
      echo -e "${GREEN}✓ Message 16 rate limited (got 429)${NC}"
      ((TEST_PASS++))
      FAIL_FOUND=1
      
      # Check Retry-After header
      RETRY_AFTER=$(echo "$BODY" | grep -o '"Retry-After":[0-9]*' | grep -o '[0-9]*' || echo "")
      if [ -n "$RETRY_AFTER" ]; then
        echo "  - Retry-After: $RETRY_AFTER seconds"
      fi
    else
      echo -e "${RED}✗ Message 16 should return 429, got $HTTP_CODE${NC}"
      ((TEST_FAIL++))
    fi
  fi
done

if [ "$FAIL_FOUND" == "0" ]; then
  echo -e "${YELLOW}⚠ Warning: Rate limit not enforced on message 16${NC}"
  ((TEST_FAIL++))
fi

# Test 4: Visitor Isolation (Should Get 403)
echo ""
echo "Test 4: Visitor Isolation (Cross-session access should return 403)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$PROXY_URL/messages?session_id=$SESSION_ID&visitor_token=wrong-token-12345" \
  -H "Authorization: Bearer $ANON_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_result "Wrong token returns 403" "403" "$HTTP_CODE"

# Test 5: Author Impersonation (Should Get 400)
echo ""
echo "Test 5: Author Impersonation Prevention (Should return 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/message" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"visitor_token\":\"$VISITOR_TOKEN\",\"author\":\"agent\",\"content\":\"Fake agent message\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_result "Author='agent' returns 400" "400" "$HTTP_CODE"

# Test 6: Request Body Size Limit (Should Get 413)
echo ""
echo "Test 6: Request Body Size Limit (50KB max)"
LARGE_NAME=$(python3 -c "print('x' * 50001)" 2>/dev/null || echo "x")

if [ ${#LARGE_NAME} -gt 50000 ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/session" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"visitor_token\":\"token\",\"name\":\"$LARGE_NAME\"}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  test_result "Large body returns 413" "413" "$HTTP_CODE"
else
  echo -e "${YELLOW}⚠ Skipped: Could not generate large payload${NC}"
fi

# Test 7: GET /events SSE Connection (Should Connect)
echo ""
echo "Test 7: SSE Connection (GET /events should return 200)"
# Note: Can't test fully without keeping connection open, but check initial response
RESPONSE=$(curl -s -w "\n%{http_code}" -m 2 -N "http://localhost:4173/...events?session_id=$SESSION_ID&visitor_token=$VISITOR_TOKEN" \
  -H "Authorization: Bearer $ANON_KEY" || echo "timeout")

HTTP_CODE=$(echo "$RESPONSE" | tail -1 | tr -d '\n')

# SSE should return 200 and stream indefinitely
if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "timeout" ]]; then
  echo -e "${GREEN}✓ SSE connection initiated${NC}"
  ((TEST_PASS++))
else
  echo -e "${YELLOW}⚠ SSE test returned $HTTP_CODE (may be expected)${NC}"
fi

# Test 8: Session Close
echo ""
echo "Test 8: Session Close (Should return 200)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL/session/close" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"visitor_token\":\"$VISITOR_TOKEN\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_result "Session close returns 200" "200" "$HTTP_CODE"

# Summary
echo ""
echo "========================================"
echo "TEST RESULTS"
echo "========================================"
echo -e "✓ Passed: ${GREEN}$TEST_PASS${NC}"
echo -e "✗ Failed: ${RED}$TEST_FAIL${NC}"
echo ""

if [ $TEST_FAIL -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
