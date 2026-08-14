$anonKey = $env:VITE_SUPABASE_ANON_KEY
$prodUrl = "https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy"
$headers = @{"Authorization" = "Bearer $anonKey"; "Content-Type" = "application/json"; "Origin" = "http://localhost:4173"}

$results = @{}

Write-Host "PRODUCTION DEPLOYMENT VERIFICATION TEST"
Write-Host ""

# Create test sessions
Write-Host "Creating test sessions..."
$tokenA = [Guid]::NewGuid().ToString()
$tokenB = [Guid]::NewGuid().ToString()
$sessionA = ""
$sessionB = ""

try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/session" -Method POST -Headers $headers -Body (@{visitor_token = $tokenA; name = "A"; email = "a@test"; phone = "555"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $sessionA = ($resp.Content | ConvertFrom-Json).id
} catch { $results["Session creation"] = "FAIL"; exit 1 }

try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/session" -Method POST -Headers $headers -Body (@{visitor_token = $tokenB; name = "B"; email = "b@test"; phone = "555"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $sessionB = ($resp.Content | ConvertFrom-Json).id
} catch { $results["Session creation"] = "FAIL"; exit 1 }

$results["Session creation"] = "PASS"

Write-Host ""
Write-Host "CRITICAL SECURITY TESTS"
Write-Host ""

# Test 1: Valid visitor message
Write-Host "1. Valid visitor message (author=visitor)"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body (@{session_id = $sessionA; visitor_token = $tokenA; author = "visitor"; content = "test"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    Write-Host "   PASS (201)"
    $results["Visitor message"] = "PASS"
} catch {
    Write-Host "   FAIL ($($_.Exception.Response.StatusCode.Value))"
    $results["Visitor message"] = "FAIL"
}

# Test 2: Block agent impersonation
Write-Host "2. Block agent impersonation (author=agent)"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body (@{session_id = $sessionA; visitor_token = $tokenA; author = "agent"; content = "x"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    Write-Host "   FAIL - should be rejected but got $($resp.StatusCode)"
    $results["Agent impersonation blocked"] = "FAIL"
} catch {
    $code = $_.Exception.Response.StatusCode.Value
    if ($code -eq 400) {
        Write-Host "   PASS (400)"
        $results["Agent impersonation blocked"] = "PASS"
    } else {
        Write-Host "   FAIL - got $code instead of 400"
        $results["Agent impersonation blocked"] = "FAIL"
    }
}

# Test 3: Block assistant impersonation
Write-Host "3. Block assistant impersonation (author=assistant)"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body (@{session_id = $sessionA; visitor_token = $tokenA; author = "assistant"; content = "x"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    Write-Host "   FAIL"
    $results["Assistant impersonation blocked"] = "FAIL"
} catch {
    $code = $_.Exception.Response.StatusCode.Value
    Write-Host "   PASS ($code)"
    $results["Assistant impersonation blocked"] = if ($code -eq 400) { "PASS" } else { "FAIL" }
}

# Test 4: Block system impersonation
Write-Host "4. Block system impersonation (author=system)"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body (@{session_id = $sessionA; visitor_token = $tokenA; author = "system"; content = "x"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $results["System impersonation blocked"] = "FAIL"
} catch {
    $code = $_.Exception.Response.StatusCode.Value
    $results["System impersonation blocked"] = if ($code -eq 400) { "PASS" } else { "FAIL" }
}

# Test 5: Block admin impersonation
Write-Host "5. Block admin impersonation (author=admin)"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body (@{session_id = $sessionA; visitor_token = $tokenA; author = "admin"; content = "x"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $results["Admin impersonation blocked"] = "FAIL"
} catch {
    $code = $_.Exception.Response.StatusCode.Value
    $results["Admin impersonation blocked"] = if ($code -eq 400) { "PASS" } else { "FAIL" }
}

# Test 6: Input validation - empty content
Write-Host "6. Input validation (empty content)"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body (@{session_id = $sessionA; visitor_token = $tokenA; author = "visitor"; content = ""} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $results["Empty content validation"] = "FAIL"
} catch {
    $code = $_.Exception.Response.StatusCode.Value
    $results["Empty content validation"] = if ($code -eq 400) { "PASS" } else { "FAIL" }
}

# Test 7: Input validation - content over 4000
Write-Host "7. Input validation (content >4000 chars)"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body (@{session_id = $sessionA; visitor_token = $tokenA; author = "visitor"; content = ("x" * 4001)} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $results["Content length validation"] = "FAIL"
} catch {
    $code = $_.Exception.Response.StatusCode.Value
    $results["Content length validation"] = if ($code -eq 400) { "PASS" } else { "FAIL" }
}

# Test 8: Cross-visitor isolation
Write-Host "8. Cross-visitor isolation (message with B token in A session)"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/message" -Method POST -Headers $headers -Body (@{session_id = $sessionA; visitor_token = $tokenB; author = "visitor"; content = "x"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $results["Cross-visitor isolation"] = "FAIL"
} catch {
    $code = $_.Exception.Response.StatusCode.Value
    $results["Cross-visitor isolation"] = if ($code -eq 403) { "PASS" } else { "FAIL" }
}

# Test 9: Missing Authorization
Write-Host "9. Missing Authorization header"
try {
    $noAuthHeaders = @{"Content-Type" = "application/json"; "Origin" = "http://localhost:4173"}
    $resp = Invoke-WebRequest -Uri "$prodUrl/session" -Method POST -Headers $noAuthHeaders -Body (@{visitor_token = "test"; name = "test"; email = "test"; phone = "test"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    $results["Missing Authorization"] = "FAIL"
} catch {
    $code = $_.Exception.Response.StatusCode.Value
    $results["Missing Authorization"] = if ($code -eq 401) { "PASS" } else { "FAIL" }
}

# Test 10: Valid operations still work
Write-Host "10. Valid own-session GET"
try {
    $resp = Invoke-WebRequest -Uri "$prodUrl/session?token=$tokenA" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    $results["Own-session access"] = if ($resp.StatusCode -eq 200) { "PASS" } else { "FAIL" }
} catch {
    $results["Own-session access"] = "FAIL"
}

Write-Host ""
Write-Host "RESULTS"
Write-Host ""
$passCount = 0
$failCount = 0
$results.GetEnumerator() | ForEach-Object {
    if ($_.Value -eq "PASS") {
        $passCount++
        Write-Host "$($_.Key): PASS"
    } else {
        $failCount++
        Write-Host "$($_.Key): $($_.Value)"
    }
}

Write-Host ""
Write-Host "Summary: $passCount PASS, $failCount FAIL out of $($results.Count)"
Write-Host ""
if ($failCount -eq 0) {
    Write-Host "FINAL STATUS: PASS"
} else {
    Write-Host "FINAL STATUS: FAIL"
}
