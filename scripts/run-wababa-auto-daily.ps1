$ErrorActionPreference = "Stop"

$uri = "http://localhost:3001/api/wababa-auto-daily"
$logDir = "C:\work\kr-stock-agent-data-new"
$resultPath = Join-Path $logDir "wababa-auto-daily-task-last-result.json"
$errorPath = Join-Path $logDir "wababa-auto-daily-task-last-error.txt"

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

try {
  $result = Invoke-RestMethod -Uri $uri -Method GET -TimeoutSec 120
  $result | ConvertTo-Json -Depth 20 | Out-File -FilePath $resultPath -Encoding utf8
  if (Test-Path $errorPath) {
    Remove-Item $errorPath -Force
  }
}
catch {
  $message = @(
    "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 와바바 자동운용 호출 실패",
    $_.Exception.Message,
    "서버가 켜져 있는지 확인: cd C:\work\kr-stock-agent ; npm run dev"
  ) -join "`r`n"
  $message | Out-File -FilePath $errorPath -Encoding utf8
  throw
}
