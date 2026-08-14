#!/usr/bin/env pwsh

$anonKey = $env:VITE_SUPABASE_ANON_KEY
$baseUrl = "https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy"
$headers = @{
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}

Write-Host "=== SECURITY HARDENING VERIFICATION ===" -ForegroundColor Yellow
Write-Host ""

# Test helper
function Make-Request {
    param([string]$Method, [string]$Path, [hashtable]$Body)
    
    $uri = "$baseUrl$Path"
    $json = $Body | ConvertTo-Json -Compress
    
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $json -StatusCodeVariable statusVar
        return @{ Code = $statusVar; Body = $resp }
    }
    catch {
        $code = $_.Exception.Response.StatusCode.Value
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $reader.Close()
        return @{ Code = $code; Body = $body }
    }
}

$tests = @()

# Test 1: Valid session creation
Write-Host "1. Valid session creation"
$result = Make-Request "POST" "/session" @{
    visitor_token = "test-$(Get-Random)"
    name = "Test"
    email = "test@test"
    phone = "555"
}
Write-Host "   Status: $($result.Code) - $(if ($result.Code -eq 201) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Valid session creation"; Pass = ($result.Code -eq 201) }
if ($result.Code -eq 201) {
    $sessionId = ($result.Body | ConvertFrom-Json).id
    $visitorToken = ($result.Body | ConvertFrom-Json).visitor_token
}

# Test 2: Valid visitor message
Write-Host "2. Valid visitor message (author=visitor)"
$result = Make-Request "POST" "/message" @{
    session_id = $sessionId
    visitor_token = $visitorToken
    author = "visitor"
    content = "Hello"
}
Write-Host "   Status: $($result.Code) - $(if ($result.Code -eq 201) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Valid visitor message"; Pass = ($result.Code -eq 201) }

# Test 3: Impersonation attempt (agent)
Write-Host "3. Block agent impersonation (author=agent)"
$result = Make-Request "POST" "/message" @{
    session_id = $sessionId
    visitor_token = $visitorToken
    author = "agent"
    content = "Hacked"
}
Write-Host "   Status: $($result.Code) - $(if ($result.Code -eq 400) { 'PASS' } else { 'FAIL' })"
Write-Host "   Error: $($result.Body | ConvertFrom-Json -ErrorAction SilentlyContinue | Select-Object -ExpandProperty error)"
$tests += @{ Name = "Block agent impersonation"; Pass = ($result.Code -eq 400) }

# Test 4: Impersonation attempt (system)
Write-Host "4. Block system impersonation (author=system)"
$result = Make-Request "POST" "/message" @{
    session_id = $sessionId
    visitor_token = $visitorToken
    author = "system"
    content = "Hacked"
}
Write-Host "   Status: $($result.Code) - $(if ($result.Code -eq 400) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Block system impersonation"; Pass = ($result.Code -eq 400) }

# Test 5: Impersonation attempt (admin)
Write-Host "5. Block admin impersonation (author=admin)"
$result = Make-Request "POST" "/message" @{
    session_id = $sessionId
    visitor_token = $visitorToken
    author = "admin"
    content = "Hacked"
}
Write-Host "   Status: $($result.Code) - $(if ($result.Code -eq 400) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Block admin impersonation"; Pass = ($result.Code -eq 400) }

# Test 6: Empty content validation
Write-Host "6. Reject empty content"
$result = Make-Request "POST" "/message" @{
    session_id = $sessionId
    visitor_token = $visitorToken
    author = "visitor"
    content = ""
}
Write-Host "   Status: $($result.Code) - $(if ($result.Code -eq 400) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Reject empty content"; Pass = ($result.Code -eq 400) }

# Test 7: Content length validation
Write-Host "7. Reject oversized content (>4000 chars)"
$result = Make-Request "POST" "/message" @{
    session_id = $sessionId
    visitor_token = $visitorToken
    author = "visitor"
    content = [string]::new("x", 4001)
}
Write-Host "   Status: $($result.Code) - $(if ($result.Code -eq 400) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Reject oversized content"; Pass = ($result.Code -eq 400) }

# Test 8: Cross-visitor isolation
Write-Host "8. Enforce cross-visitor isolation"
$token2 = "different-token-$(Get-Random)"
$result = Make-Request "POST" "/message" @{
    session_id = $sessionId
    visitor_token = $token2
    author = "visitor"
    content = "Hacked"
}
Write-Host "   Status: $($result.Code) - $(if ($result.Code -eq 403) { 'PASS' } else { 'FAIL' })"
$tests += @{ Name = "Enforce cross-visitor isolation"; Pass = ($result.Code -eq 403) }

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
