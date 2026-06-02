<#
  "Wababa Auto Publish" 작업 스케줄러 등록 스크립트 (Phase 41-C)

  평일 08:55에 publish-public-data.ps1 -Commit -Push 를 실행하도록 등록한다.
  기존 "Wababa Auto Daily"(08:45 데이터 생성)는 건드리지 않는다.

  안전: 기본은 PREVIEW(등록 내용만 출력, 실제 등록 안 함).
        실제 등록은 -Apply 를 명시할 때만 수행한다.

  사용:
    # 미리보기(등록 안 함)
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ops\register-wababa-auto-publish.ps1
    # 실제 등록
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ops\register-wababa-auto-publish.ps1 -Apply
    # 등록 해제
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ops\register-wababa-auto-publish.ps1 -Unregister
#>
[CmdletBinding()]
param(
  [switch]$Apply,
  [switch]$Unregister
)

$ErrorActionPreference = "Stop"

$TaskName    = "Wababa Auto Publish"
$Repo        = "C:\work\kr-stock-agent"
$Script      = Join-Path $Repo "scripts\ops\publish-public-data.ps1"
$RunAt       = "08:55"
$Days        = @("Monday","Tuesday","Wednesday","Thursday","Friday")
$Argument    = "-NoProfile -ExecutionPolicy Bypass -File `"$Script`" -Commit -Push"

Write-Host "=== Wababa Auto Publish 등록 스크립트 ==="
Write-Host "작업 이름 : $TaskName"
Write-Host "실행 시각 : 평일($($Days -join ',')) $RunAt"
Write-Host "실행 명령 : powershell.exe $Argument"
Write-Host "작업 폴더 : $Repo"
Write-Host "계정      : $env:USERNAME (로그온 시에만 실행, 비관리자)"
Write-Host ""

if (-not (Test-Path $Script)) {
  Write-Host "ERROR: publish 스크립트가 없습니다: $Script"
  exit 1
}

if ($Unregister) {
  $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if (-not $existing) { Write-Host "등록된 '$TaskName' 작업이 없습니다."; exit 0 }
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "'$TaskName' 등록 해제 완료."
  exit 0
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $Argument -WorkingDirectory $Repo
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Days -At $RunAt
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

if (-not $Apply) {
  Write-Host "[PREVIEW] 실제 등록하지 않았습니다. 등록하려면 -Apply 를 붙여 다시 실행하세요."
  Write-Host "[PREVIEW] 등록될 트리거: Weekly $($Days -join ',') @ $RunAt, StartWhenAvailable"
  exit 0
}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings `
  -Description "와바바 공개 데이터 자동 publish (Phase 41-C). 평일 08:55, freshness gate 통과 시 public JSON commit/push." `
  -Force | Out-Null

Write-Host "'$TaskName' 등록 완료. (평일 $RunAt)"
Write-Host "확인: Get-ScheduledTask -TaskName '$TaskName'"
exit 0
