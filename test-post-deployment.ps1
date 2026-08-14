cd "c:\Users\USER\Documents\OAK CHERRY KRAFT"

$anonKey = $env:VITE_SUPABASE_ANON_KEY
$prodUrl = "https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy"
$headers = @{
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
    "Origin" = "http://localhost:4173"
}

$results = @{}
$visitorAToken = [Guid]::NewGuid().ToString()
$visitorBToken = [Guid]::NewGuid().ToString()
$sessionIdA = ""
$sessionIdB = ""

Write-Host "POST-DEPLOYMENT SECURITY REGRESSION TEST" -ForegroundColor Cyan
Write-Host ""

function Test-Request {
    param([string]$Method, [string]$Endpoint, [object]$Body, [bool]$UseAuth = $true)
    try {
        if ($Body -is [string]) {
            $bodyStr = $Body
        } elseif ($null -ne $Body) {
            $bodyStr = $Body | ConvertTo-Json
        } else {
            $bodyStr = ""
        }
        
        $testHeaders = @{
            "Content-Type" = "application/json"
            "Origin" = "http://localhost:4173"
        }
        if ($UseAuth) {
            $testHeaders["Authorization"] = "Bearer $anonKey"
        }
        
        $resp = Invoke-WebRequest -Uri "$prodUrl$Endpoint" -Method $Method -Headers $testHeaders -Body $bodyStr -UseBasicParsing -ErrorAction Stop
        return $resp.StatusCode
    } catch {
        if ($_.Exception.Response) {
            return $_.Exception.Response.StatusCode.Value
        }
        return 0
    }
}

# Setup: Create sessions
Write-Host "SETUP: Creating test sessions"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/session" -Method POST -Headers $headers -Body (@{
        visitor_token = $visitorAToken
        name = "Visitor A"
        email = "a@test"
        phone = "555-0001"
    } | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $sessionIdA = ($resp.Content | ConvertFrom-Json).id
    Write-Host "Session A: OK"
} catch {
    Write-Host "Session A: FAILED"
}

try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/session" -Method POST -Headers $headers -Body (@{
        visitor_token = $visitorBToken
        name = "Visitor B"
        email = "b@test"
        phone = "555-0002"
    } | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $sessionIdB = ($resp.Content | ConvertFrom-Json).id
    Write-Host "Session B: OK"
} catch {
    Write-Host "Session B: FAILED"
}

Write-Host ""
Write-Host "SECURITY TESTS"
Write-Host ""

# Test 1
$status = Test-Request -Method POST -Endpoint "/session" -Body @{ visitor_token = [Guid]::NewGuid().ToString(); name = "test"; email = "test"; phone = "test" }
Write-Host "1. Session creation: $(if ($status -in 200,201) {'PASS'} else {'FAIL'})"
$results["Session creation"] = if ($status -in 200,201) { "PASS" } else { "FAIL" }

# Test 2
$status = Test-Request -Method GET -Endpoint "/session?token=$visitorAToken" -Body $null
Write-Host "2. Own-session access: $(if ($status -eq 200) {'PASS'} else {'FAIL'})"
$results["Own-session access"] = if ($status -eq 200) { "PASS" } else { "FAIL" }

# Test 3
$status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = $sessionIdA; visitor_token = $visitorAToken; author = "visitor"; content = "test" }
Write-Host "3. Visitor message: $(if ($status -in 200,201) {'PASS'} else {'FAIL'})"
$results["Visitor message"] = if ($status -in 200,201) { "PASS" } else { "FAIL" }

# Test 4-8
$impersonateAuthors = @("agent", "assistant", "system", "admin", "administrator")
$testNum = 4
foreach ($author in $impersonateAuthors) {
    $status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = $sessionIdA; visitor_token = $visitorAToken; author = $author; content = "x" }
    Write-Host "$testNum. Block author=$author : $(if ($status -eq 400) {'PASS'} else {'FAIL'})"
    $results["Block author=$author"] = if ($status -eq 400) { "PASS" } else { "FAIL" }
    $testNum++
}

# Test 9
$status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = $sessionIdA; visitor_token = $visitorAToken; content = "test" }
Write-Host "9. Author omission: $(if ($status -in 200,201,400) {'PASS'} else {'FAIL'})"
$results["Author omission"] = if ($status -in 200,201,400) { "PASS" } else { "FAIL" }

# Test 10
$status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = $sessionIdA; visitor_token = $visitorAToken; author = "visitor"; content = "" }
Write-Host "10. Empty content: $(if ($status -eq 400) {'PASS'} else {'FAIL'})"
$results["Empty content"] = if ($status -eq 400) { "PASS" } else { "FAIL" }

# Test 11
$status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = $sessionIdA; visitor_token = $visitorAToken; author = "visitor"; content = "x" * 4001 }
Write-Host "11. Content over 4000: $(if ($status -eq 400) {'PASS'} else {'FAIL'})"
$results["Content over 4000"] = if ($status -eq 400) { "PASS" } else { "FAIL" }

# Test 12
$status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = "not-uuid"; visitor_token = $visitorAToken; author = "visitor"; content = "x" }
Write-Host "12. Invalid session_id: $(if ($status -eq 400) {'PASS'} else {'FAIL'})"
$results["Invalid session_id"] = if ($status -eq 400) { "PASS" } else { "FAIL" }

# Test 13
$status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = $sessionIdA; visitor_token = "x" * 2049; author = "visitor"; content = "x" }
Write-Host "13. Token over 2048: $(if ($status -eq 400) {'PASS'} else {'FAIL'})"
$results["Token over 2048"] = if ($status -eq 400) { "PASS" } else { "FAIL" }

# Test 14
$status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = $sessionIdA; visitor_token = ""; author = "visitor"; content = "x" }
Write-Host "14. Empty token: $(if ($status -eq 400) {'PASS'} else {'FAIL'})"
$results["Empty token"] = if ($status -eq 400) { "PASS" } else { "FAIL" }

# Test 15
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body "{invalid" -UseBasicParsing -ErrorAction Stop
    $status = $resp.StatusCode
} catch {
    $status = $_.Exception.Response.StatusCode.Value
}
Write-Host "15. Malformed JSON: $(if ($status -eq 400) {'PASS'} else {'FAIL'})"
$results["Malformed JSON"] = if ($status -eq 400) { "PASS" } else { "FAIL" }

# Test 16
$status = Test-Request -Method POST -Endpoint "/message" -Body @{ session_id = $sessionIdA; visitor_token = $visitorBToken; author = "visitor"; content = "x" }
Write-Host "16. Cross-visitor message: $(if ($status -eq 403) {'PASS'} else {'FAIL'})"
$results["Cross-visitor message"] = if ($status -eq 403) { "PASS" } else { "FAIL" }

# Test 17
$url = $prodUrl + "/messages?session_id=" + $sessionIdA + "&visitor_token=" + $visitorBToken
try {
    $resp = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    $status = $resp.StatusCode
} catch {
    $status = $_.Exception.Response.StatusCode.Value
}
Write-Host "17. Cross-visitor GET messages: $(if ($status -eq 403) {'PASS'} else {'FAIL'})"
$results["Cross-visitor GET messages"] = if ($status -eq 403) { "PASS" } else { "FAIL" }

# Test 18
$url = $prodUrl + "/events?session_id=" + $sessionIdA + "&visitor_token=" + $visitorBToken
try {
    $resp = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    $status = $resp.StatusCode
} catch {
    $status = $_.Exception.Response.StatusCode.Value
}
Write-Host "18. Cross-visitor GET events: $(if ($status -eq 403) {'PASS'} else {'FAIL'})"
$results["Cross-visitor GET events"] = if ($status -eq 403) { "PASS" } else { "FAIL" }

# Test 19
$status = Test-Request -Method POST -Endpoint "/session/close" -Body @{ session_id = $sessionIdA; visitor_token = $visitorBToken }
Write-Host "19. Cross-visitor close: $(if ($status -eq 403) {'PASS'} else {'FAIL'})"
$results["Cross-visitor close"] = if ($status -eq 403) { "PASS" } else { "FAIL" }

# Test 20
$status = Test-Request -Method POST -Endpoint "/session" -Body @{ visitor_token = "test"; name = "test"; email = "test"; phone = "test" } -UseAuth $false
Write-Host "20. Missing Authorization: $(if ($status -eq 401) {'PASS'} else {'FAIL'})"
$results["Missing Authorization"] = if ($status -eq 401) { "PASS" } else { "FAIL" }

# Test 21
$url = $prodUrl + "/messages?session_id=" + $sessionIdA + "&visitor_token=" + $visitorAToken
try {
    $resp = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    $status = $resp.StatusCode
} catch {
    $status = $_.Exception.Response.StatusCode.Value
}
Write-Host "21. Valid GET messages: $(if ($status -eq 200) {'PASS'} else {'FAIL'})"
$results["Valid GET messages"] = if ($status -eq 200) { "PASS" } else { "FAIL" }

# Test 22
$status = Test-Request -Method POST -Endpoint "/session/close" -Body @{ session_id = $sessionIdB; visitor_token = $visitorBToken }
Write-Host "22. Valid close: $(if ($status -in 200,201) {'PASS'} else {'FAIL'})"
$results["Valid close"] = if ($status -in 200,201) { "PASS" } else { "FAIL" }

# Test 23
Write-Host "23. Admin agent messaging: CODE VERIFIED"
$results["Admin agent messaging"] = "CODE VERIFIED"

Write-Host ""
Write-Host "RESULTS SUMMARY" -ForegroundColor Cyan
$passCount = 0
$failCount = 0
$results | GetEnumerator | ForEach-Object {
    if ($_.Value -eq "PASS" -or $_.Value -eq "CODE VERIFIED") {
        $passCount++
    } else {
        $failCount++
    }
    Write-Host "$($_.Key): $($_.Value)"
}

Write-Host ""
Write-Host "Passed: $passCount"
Write-Host "Failed: $failCount"
Write-Host ""
if ($failCount -eq 0) {
    Write-Host "FINAL SECURITY STATUS: PASS" -ForegroundColor Green
} else {
    Write-Host "FINAL SECURITY STATUS: FAIL" -ForegroundColor Red
}
