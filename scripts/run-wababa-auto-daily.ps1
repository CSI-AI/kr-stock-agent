$ErrorActionPreference = "Stop"

# Wababa Auto Daily — Python 직접 실행 (localhost:3001 의존 제거, Phase 35-B)
#
# 흐름: Windows 작업 스케줄러 → 이 ps1 → python build_recommendation_history.py
# 중복 매수 방지는 Python 내부 has_auto_trade_log_for_date 가드에 위임한다.
# public sanitized JSON 갱신도 Python이 직접 수행한다.

$dataDir     = "C:\work\kr-stock-agent-data-new"
$buildScript = Join-Path $dataDir "scripts\build_recommendation_history.py"
$histPath    = Join-Path $dataDir "recommendation-history.json"
$resultPath  = Join-Path $dataDir "wababa-auto-daily-task-last-result.json"
$errorPath   = Join-Path $dataDir "wababa-auto-daily-task-last-error.txt"

if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

$startedAt = Get-Date
Write-Host "[$($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))] Wababa Auto Daily 시작"
Write-Host "실행 방식: PYTHON_DIRECT"
Write-Host "실행 대상: $buildScript"

# 시간 가드: 08:40 이전 실행 차단 (route.ts isAfterRunTime 대체)
$runTime = [TimeSpan]"08:40:00"
if ($startedAt.TimeOfDay -lt $runTime) {
  $skipResult = [ordered]@{
    ok          = $true
    ran         = $false
    status      = "SKIPPED_BEFORE_RUN_TIME"
    today       = $startedAt.ToString('yyyy-MM-dd')
    generatedAt = $startedAt.ToString('yyyy-MM-dd HH:mm:ss')
    runMode     = "PYTHON_DIRECT"
    message     = "08:40 이전이므로 실행 생략"
  }
  $skipResult | ConvertTo-Json -Depth 5 | Out-File -FilePath $resultPath -Encoding utf8
  if (Test-Path $errorPath) { Remove-Item $errorPath -Force }
  Write-Host "종료 상태: SKIPPED_BEFORE_RUN_TIME"
  exit 0
}

try {
  Set-Location $dataDir
  $env:PYTHONIOENCODING = "utf-8"

  # Python build script 직접 실행
  # 평일/휴장일 판단은 build_recommendation_history.py 내부 is_market_open_day가 담당
  # 자동매매 중복 방지는 has_auto_trade_log_for_date가 담당
  & python $buildScript
  $exitCode = $LASTEXITCODE

  Write-Host "python 종료 코드: $exitCode"

  if ($exitCode -ne 0) {
    throw "build_recommendation_history.py 실패 (exit code = $exitCode)"
  }

  # 결과 요약 작성: PowerShell 5.1 ConvertFrom-Json은 키 비교가 대소문자 무시라
  # recommendation-history.json에 'ROE'/'roe'처럼 케이스만 다른 키가 함께 있으면
  # 변환이 실패한다. Python json 모듈로 평탄 요약을 받아 안전하게 파싱한다.
  $finishedAt    = Get-Date
  $summaryScript = Join-Path $PSScriptRoot "extract_auto_daily_summary.py"
  $summaryJson   = & python $summaryScript $histPath
  if ($LASTEXITCODE -ne 0) {
    throw "extract_auto_daily_summary.py 실패 (exit code = $LASTEXITCODE)"
  }
  $summary = $summaryJson | ConvertFrom-Json

  $fundOrders        = [int]$summary.fundOrderCount
  $aiOrders          = [int]$summary.aiFundOrderCount
  $fundStatus        = $summary.fundTradeStatus
  $aiStatus          = $summary.aiFundTradeStatus
  $baseDate          = $summary.baseDate
  $finalBestPickName = $summary.finalBestPickName
  $wababaPickCount   = [int]$summary.wababaPickCount
  $totalOrders       = $fundOrders + $aiOrders

  $result = [ordered]@{
    ok                = $true
    ran               = $true
    status            = "DONE"
    today             = $startedAt.ToString('yyyy-MM-dd')
    generatedAt       = $finishedAt.ToString('yyyy-MM-dd HH:mm:ss')
    runMode           = "PYTHON_DIRECT"
    elapsedSeconds    = [math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)
    baseDate          = $baseDate
    finalBestPick     = $finalBestPickName
    wababaPickCount   = $wababaPickCount
    fundTradeStatus   = $fundStatus
    fundOrderCount    = $fundOrders
    aiFundTradeStatus = $aiStatus
    aiFundOrderCount  = $aiOrders
    totalOrderCount   = $totalOrders
  }

  $result | ConvertTo-Json -Depth 5 | Out-File -FilePath $resultPath -Encoding utf8
  if (Test-Path $errorPath) { Remove-Item $errorPath -Force }

  Write-Host "종료 상태: DONE"
  Write-Host "체결 주문: WABABA=$fundOrders / AI=$aiOrders / total=$totalOrders"
  exit 0
}
catch {
  $now = Get-Date
  $exceptionMessage = $_.Exception.Message
  $message = @(
    "[$($now.ToString('yyyy-MM-dd HH:mm:ss'))] Wababa Auto Daily 실패 (PYTHON_DIRECT)",
    $exceptionMessage,
    "스크립트: $buildScript",
    "재시도 명령: cd C:\work\kr-stock-agent-data-new ; python scripts\build_recommendation_history.py"
  ) -join "`r`n"
  $message | Out-File -FilePath $errorPath -Encoding utf8

  $errorResult = [ordered]@{
    ok          = $false
    ran         = $false
    status      = "ERROR"
    today       = $now.ToString('yyyy-MM-dd')
    generatedAt = $now.ToString('yyyy-MM-dd HH:mm:ss')
    runMode     = "PYTHON_DIRECT"
    message     = $exceptionMessage
  }
  $errorResult | ConvertTo-Json -Depth 5 | Out-File -FilePath $resultPath -Encoding utf8

  Write-Host "종료 상태: ERROR"
  Write-Host "사유: $exceptionMessage"
  exit 1
}
