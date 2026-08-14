#!/usr/bin/env pwsh

$anonKey = $env:VITE_SUPABASE_ANON_KEY
$baseUrl = "https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy"

Write-Host "=== SECURITY HARDENING VERIFICATION ===" -ForegroundColor Yellow
Write-Host ""

$tests = @()

# Test 1: Valid session creation
Write-Host "1. Valid session creation..."
$token1 = "test-$(Get-Random)"
try {
    $result = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/session" `
        -H "Authorization: Bearer $anonKey" `
        -H "Content-Type: application/json" `
        -d "{`"visitor_token`":`"$token1`",`"name`":`"Test`",`"email`":`"test@test`",`"phone`":`"555`"}"
    
    $lines = $result -split "`n"
    $httpCode = $lines[-1]
    $body = $lines[0..($lines.Length-2)] -join "`n"
    
    $pass = ($httpCode -eq "201")
    Write-Host "   Status: $httpCode - $(if ($pass) { 'PASS' } else { 'FAIL' })"
    $tests += @{ Name = "Valid session creation"; Pass = $pass }
    
    if ($httpCode -eq "201") {
        $json = $body | ConvertFrom-Json
        $sessionId = $json.id
        $visitorToken = $json.visitor_token
    }
} catch {
    Write-Host "   ERROR: $_"
    $tests += @{ Name = "Valid session creation"; Pass = $false }
}

if (-not $sessionId) {
    Write-Host "Cannot proceed without valid session"
    exit 1
}

# Test 2: Valid visitor message
Write-Host "2. Valid visitor message (author=visitor)..."
$result = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/message" `
    -H "Authorization: Bearer $anonKey" `
    -H "Content-Type: application/json" `
    -d "{`"session_id`":`"$sessionId`",`"visitor_token`":`"$visitorToken`",`"author`":`"visitor`",`"content`":`"Hello`"}"

$lines = $result -split "`n"
$httpCode = $lines[-1]
$pass = ($httpCode -eq "201")
Write-Host "   Status: $httpCode - $(if ($pass) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Valid visitor message"; Pass = $pass }

# Test 3: Block agent impersonation
Write-Host "3. Block agent impersonation (author=agent)..."
$result = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/message" `
    -H "Authorization: Bearer $anonKey" `
    -H "Content-Type: application/json" `
    -d "{`"session_id`":`"$sessionId`",`"visitor_token`":`"$visitorToken`",`"author`":`"agent`",`"content`":`"test`"}"

$lines = $result -split "`n"
$httpCode = $lines[-1]
$pass = ($httpCode -eq "400")
Write-Host "   Status: $httpCode - $(if ($pass) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Block agent impersonation"; Pass = $pass }

# Test 4: Block system impersonation
Write-Host "4. Block system impersonation (author=system)..."
$result = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/message" `
    -H "Authorization: Bearer $anonKey" `
    -H "Content-Type: application/json" `
    -d "{`"session_id`":`"$sessionId`",`"visitor_token`":`"$visitorToken`",`"author`":`"system`",`"content`":`"test`"}"

$lines = $result -split "`n"
$httpCode = $lines[-1]
$pass = ($httpCode -eq "400")
Write-Host "   Status: $httpCode - $(if ($pass) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Block system impersonation"; Pass = $pass }

# Test 5: Block admin impersonation
Write-Host "5. Block admin impersonation (author=admin)..."
$result = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/message" `
    -H "Authorization: Bearer $anonKey" `
    -H "Content-Type: application/json" `
    -d "{`"session_id`":`"$sessionId`",`"visitor_token`":`"$visitorToken`",`"author`":`"admin`",`"content`":`"test`"}"

$lines = $result -split "`n"
$httpCode = $lines[-1]
$pass = ($httpCode -eq "400")
Write-Host "   Status: $httpCode - $(if ($pass) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Block admin impersonation"; Pass = $pass }

# Test 6: Reject empty content
Write-Host "6. Reject empty content..."
$result = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/message" `
    -H "Authorization: Bearer $anonKey" `
    -H "Content-Type: application/json" `
    -d "{`"session_id`":`"$sessionId`",`"visitor_token`":`"$visitorToken`",`"author`":`"visitor`",`"content`":`"`"}"

$lines = $result -split "`n"
$httpCode = $lines[-1]
$pass = ($httpCode -eq "400")
Write-Host "   Status: $httpCode - $(if ($pass) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Reject empty content"; Pass = $pass }

# Test 7: Reject oversized content
Write-Host "7. Reject oversized content (>4000 chars)..."
$bigContent = [string]::new("x", 4001)
$result = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/message" `
    -H "Authorization: Bearer $anonKey" `
    -H "Content-Type: application/json" `
    -d "{`"session_id`":`"$sessionId`",`"visitor_token`":`"$visitorToken`",`"author`":`"visitor`",`"content`":`"$bigContent`"}"

$lines = $result -split "`n"
$httpCode = $lines[-1]
$pass = ($httpCode -eq "400")
Write-Host "   Status: $httpCode - $(if ($pass) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Reject oversized content"; Pass = $pass }

# Test 8: Cross-visitor isolation
Write-Host "8. Enforce cross-visitor isolation..."
$token2 = "different-$(Get-Random)"
$result = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/message" `
    -H "Authorization: Bearer $anonKey" `
    -H "Content-Type: application/json" `
    -d "{`"session_id`":`"$sessionId`",`"visitor_token`":`"$token2`",`"author`":`"visitor`",`"content`":`"test`"}"

$lines = $result -split "`n"
$httpCode = $lines[-1]
$pass = ($httpCode -eq "403")
Write-Host "   Status: $httpCode - $(if ($pass) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Enforce cross-visitor isolation"; Pass = $pass }

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Yellow
$passCount = ($tests | Where-Object { $_.Pass }).Count
$failCount = ($tests | Where-Object { -not $_.Pass }).Count

foreach ($test in $tests) {
    $status = if ($test.Pass) { "[PASS]" } else { "[FAIL]" }
    Write-Host "$status - $($test.Name)"
}

Write-Host ""
Write-Host "Results: $passCount / $($tests.Count) tests passed"

if ($failCount -eq 0) {
    Write-Host "FINAL STATUS: PASS - Hardening is active and working" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FINAL STATUS: FAIL - $failCount tests failed" -ForegroundColor Red
    exit 1
}
