$results = @()
foreach ($i in 1..3) {
  $file = "lighthouse-phase6-run$i.json"
  if (Test-Path $file) {
    $json = Get-Content $file | ConvertFrom-Json
    $results += @{
      run = $i
      cls = [Math]::Round($json.audits.'cumulative-layout-shift'.numericValue, 3)
      lcp = [Math]::Round($json.audits.'largest-contentful-paint'.numericValue, 0)
      tbt = [Math]::Round($json.audits.'total-blocking-time'.numericValue, 0)
      si = [Math]::Round($json.audits.'speed-index'.numericValue, 0)
    }
  }
}

$output = @"
=== PHASE 6 BASELINE METRICS ===

Run | CLS | LCP (ms) | TBT (ms) | SI (ms)
$(($results | ForEach-Object { "$($_.run) | $($_.cls) | $($_.lcp) | $($_.tbt) | $($_.si)" }) -join "`n")

MEDIAN VALUES:
CLS: $( ($results | Sort-Object cls)[1].cls)
LCP: $( ($results | Sort-Object lcp)[1].lcp) ms
TBT: $( ($results | Sort-Object tbt)[1].tbt) ms
SI: $( ($results | Sort-Object si)[1].si) ms
"@

$output | Out-File phase6-baseline-metrics.txt
$output
