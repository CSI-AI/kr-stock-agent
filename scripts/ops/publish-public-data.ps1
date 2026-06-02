<#
  Wababa Auto Publish - 공개 데이터(public/data/recommendation-history.json)만
  안전하게 commit/push 한다. (Phase 41-C)

  흐름: Wababa Auto Daily(08:45)가 public JSON을 갱신 -> 이 스크립트(08:55)가
        freshness gate 통과 + 안전장치 확인 후 단일 파일을 commit/push -> Vercel 반영.

  기본은 검사만. -Commit 으로 커밋까지, -Push 로 푸시까지.
  작업 스케줄러에서는 -Commit -Push 로 호출한다.

  안전장치:
   - 브랜치가 master가 아니면 중단
   - freshness gate(--allow-unpublished) FAIL이면 중단
   - 허용 외 dirty/untracked가 있으면 중단 (허용: public JSON, next-env.d.ts)
   - 공개 JSON에 C:\ / tradeHistoryPath / kr-stock-agent-data-new 가 있으면 중단
   - origin/master 대비 diverged(behind>0)이면 중단
   - public JSON 변경이 없으면 정상 종료(커밋 안 함)
   - stage는 public JSON 단일 파일만. next-env.d.ts는 절대 stage 안 함
   - push 실패 시 재시도하지 않고 로그만 남김
#>
[CmdletBinding()]
param(
  [switch]$Commit,
  [switch]$Push
)

$ErrorActionPreference = "Stop"

$Repo      = "C:\work\kr-stock-agent"
$PublicRel = "public/data/recommendation-history.json"
$LogsDir   = Join-Path $Repo "logs"
$LogPath   = Join-Path $LogsDir "wababa-auto-publish.log"
$ErrPath   = Join-Path $LogsDir "wababa-auto-publish-error.log"

if (-not (Test-Path $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir | Out-Null }

function Write-Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'), $msg
  Write-Host $line
  Add-Content -Path $LogPath -Value $line -Encoding utf8
}

function Stop-Fail([string]$msg) {
  $line = "[{0}] FAIL: {1}" -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'), $msg
  Write-Host $line
  Add-Content -Path $LogPath -Value $line -Encoding utf8
  Add-Content -Path $ErrPath -Value $line -Encoding utf8
  exit 1
}

Set-Location $Repo
$env:PYTHONIOENCODING = "utf-8"
Write-Log "=== Wababa Auto Publish 시작 (Commit=$Commit Push=$Push) ==="

# 1) 브랜치 확인
$branch = (& git rev-parse --abbrev-ref HEAD 2>$null).Trim()
if ($branch -ne "master") { Stop-Fail "현재 브랜치가 master가 아님: '$branch'" }

# 2) freshness gate (미반영은 publish 대상이므로 --allow-unpublished)
& python scripts\qa\check_public_data_freshness.py --allow-unpublished
if ($LASTEXITCODE -ne 0) { Stop-Fail "freshness gate FAIL (exit $LASTEXITCODE) - 누출/sanitize/원본불일치 의심" }
Write-Log "freshness gate PASS"

# 3) dirty/untracked 검사 - 허용: public JSON, next-env.d.ts
$allowed = @($PublicRel, "next-env.d.ts")
$publicChanged = $false
$unexpected = @()
$porcelain = & git status --porcelain
foreach ($entry in $porcelain) {
  if ([string]::IsNullOrWhiteSpace($entry)) { continue }
  $path = $entry.Substring(3).Trim().Trim('"')
  $norm = $path -replace '\\', '/'
  if ($norm -eq $PublicRel) { $publicChanged = $true; continue }
  if ($allowed -contains $norm) { continue }
  $unexpected += $norm
}
if ($unexpected.Count -gt 0) { Stop-Fail "예상 외 변경/untracked 파일: $($unexpected -join ', ')" }

# 4) 공개 JSON 내부 경로/민감 문자열 직접 검사 (gate와 별개의 belt-and-suspenders)
$publicText = Get-Content -Raw -Encoding utf8 (Join-Path $Repo $PublicRel)
foreach ($bad in @('C:\', 'tradeHistoryPath', 'kr-stock-agent-data-new')) {
  if ($publicText.Contains($bad)) { Stop-Fail "공개 JSON에 금지 문자열 노출: '$bad'" }
}

# 5) public JSON 변경 없으면 정상 종료
if (-not $publicChanged) { Write-Log "public JSON 변경 없음 - 작업 종료(정상)"; exit 0 }
Write-Log "public JSON 변경 감지"

# 6) origin/master 동기화 상태 - diverged/behind 차단
& git fetch origin master --quiet 2>$null
if ($LASTEXITCODE -ne 0) { Stop-Fail "git fetch 실패 - 네트워크/자격증명 확인" }
$counts = (& git rev-list --left-right --count origin/master...HEAD).Trim() -split '\s+'
$behind = [int]$counts[0]
$ahead  = [int]$counts[1]
if ($behind -gt 0) { Stop-Fail "로컬이 origin/master보다 $behind 커밋 뒤처짐(diverged) - 수동 동기화 필요" }
Write-Log "origin 동기화 상태 OK (behind=$behind ahead=$ahead)"

if (-not $Commit) { Write-Log "검사 통과 (Commit 미지정) - stage/commit 생략, 종료"; exit 0 }

# 7) 단일 파일 stage + 검증
& git add -- $PublicRel
$staged = @(& git diff --cached --name-only | ForEach-Object { ($_ -replace '\\','/').Trim() } | Where-Object { $_ })
if ($staged.Count -ne 1 -or $staged[0] -ne $PublicRel) {
  Stop-Fail "staged가 public JSON 1개가 아님: [$($staged -join ', ')]"
}
Write-Log "staged 확인: $PublicRel (1개)"

# 8) baseDate 기반 commit 메시지
$baseDate = (& python -c "import json,io;print(json.load(io.open(r'public/data/recommendation-history.json',encoding='utf-8')).get('baseDate',''))").Trim()
$commitMsg = "chore(data): refresh public recommendation history $baseDate".Trim()
& git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) { Stop-Fail "git commit 실패" }
$hash = (& git rev-parse --short HEAD).Trim()
Write-Log "commit 완료: $hash ($commitMsg)"

if (-not $Push) { Write-Log "Push 미지정 - push 생략, 종료"; exit 0 }

# 9) push (재시도 없음)
& git push origin master
if ($LASTEXITCODE -ne 0) {
  Stop-Fail "git push 실패 - Git Credential Manager 로그인 필요할 수 있음. 재시도 안 함(commit은 로컬에 남음: $hash)."
}
Write-Log "push 완료: origin/master <- $hash"
Write-Log "=== Wababa Auto Publish 정상 종료 ==="
exit 0
