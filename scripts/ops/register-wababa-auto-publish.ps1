<#
  "Wababa Auto Publish" 작업 스케줄러 등록 스크립트 (Phase 41-C)

  평일 17:00에 publish-public-data.ps1 -Commit -Push 를 실행하도록 등록한다.
  (WABABA-AUTO-PUBLISH-SAME-DAY-SCHEDULE-ALIGNMENT — 구 08:55 계약 폐기)

  왜 17:00 인가: 16:25 Auto Apply 로 canonical 에 그 거래일 장부가 들어간 *직후*,
  같은 실제 거래일 저녁에 홈페이지 반영을 끝내야 다음 날 08:40 Founder 종합보고가
  전날 전체 결과(장부+홈페이지+commit/push+배포+라이브검증)를 완결해 담을 수 있다.
  08:55 는 08:40 보고보다 15분 늦어 항상 미완결이었다.

  "평일" 은 트리거 조건일 뿐이고, 실제 publish 여부는 스크립트 내부 gate 가
  한국 증시 실제 거래일 + 당일 Auto Apply 선행 완료로 판정한다(휴장일 self-skip).
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
$RunAt       = "17:00"
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
# 중복 실행 방지 + 실패 시 당일 내 30분 간격 최대 2회 재시도(§8). 다음 날로 넘기지 않는다 —
# 넘어가더라도 스크립트 gate 가 "당일 Auto Apply 선행 완료" 를 요구해 자동 publish 되지 않는다.
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -MultipleInstances IgnoreNew -RestartInterval (New-TimeSpan -Minutes 30) -RestartCount 2

if (-not $Apply) {
  Write-Host "[PREVIEW] 실제 등록하지 않았습니다. 등록하려면 -Apply 를 붙여 다시 실행하세요."
  Write-Host "[PREVIEW] 등록될 트리거: Weekly $($Days -join ',') @ $RunAt, StartWhenAvailable"
  exit 0
}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings `
  -Description "와바바 공개 데이터 자동 publish. 평일 17:00(16:25 Auto Apply 이후 같은 거래일). 실제 거래일·Auto Apply 선행 gate 통과 시에만 public JSON commit/push -> Vercel 자동배포 -> 운영 URL 라이브 검증." `
  -Force | Out-Null

Write-Host "'$TaskName' 등록 완료. (평일 $RunAt)"
Write-Host "확인: Get-ScheduledTask -TaskName '$TaskName'"
exit 0
