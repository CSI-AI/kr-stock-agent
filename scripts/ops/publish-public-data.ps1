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
  [switch]$Push,
  [switch]$ResolveOnly
)

$ErrorActionPreference = "Stop"

# Resolve-PythonInvoker (exit-9009 fix) — 공용 helper 1개만 dot-source 한다.
# bare 'python' 은 이 호스트에서 0바이트 WindowsApps 앱실행 별칭 스텁으로만 해결돼
# 비대화형 스케줄러에서 미해결(exit 9009) 되므로 절대 직접 호출하지 않는다.
. (Join-Path (Split-Path -Parent $PSScriptRoot) "resolve-python-invoker.ps1")

$Repo      = "C:\work\kr-stock-agent"
$PublicRel = "public/data/recommendation-history.json"
$LogsDir   = Join-Path $Repo "logs"
$LogPath   = Join-Path $LogsDir "wababa-auto-publish.log"
$ErrPath   = Join-Path $LogsDir "wababa-auto-publish-error.log"

# 내구성 상태 산출물(08:40 Founder 종합보고가 읽는 원천).
# reports/ 는 REPO1 .gitignore 대상 -> 이 스크립트의 dirty 가드를 건드리지 않고 stage 되지도 않는다.
$StatusDir  = Join-Path $Repo "reports\wababa"
$StatusJson = Join-Path $StatusDir "wababa-auto-publish-status-latest.json"
$StatusMd   = Join-Path $StatusDir "wababa-auto-publish-status-latest.md"

if (-not (Test-Path $LogsDir))   { New-Item -ItemType Directory -Path $LogsDir   | Out-Null }
if (-not (Test-Path $StatusDir)) { New-Item -ItemType Directory -Path $StatusDir -Force | Out-Null }

function Write-Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'), $msg
  Write-Host $line
  Add-Content -Path $LogPath -Value $line -Encoding utf8
}

# 매 종료 경로에서 홈페이지 반영 결과를 기록한다(성공·no-change·BLOCKED 모두).
# 실패해도 본 작업 exit code 를 바꾸지 않는다(보고용 부가 산출물).
function Write-PublishStatus {
  param(
    [string]$Status,                 # PUBLISHED / NO_CHANGE / BLOCKED_<code>
    [string]$Verdict,                # PASS / BLOCKED
    [string]$Reason = "",
    [string]$CommitHash = "",
    [bool]$Pushed = $false,
    [bool]$PublicChanged = $false,
    [string]$FounderAction = "없음"
  )
  try {
    $sum = $null
    $extractor = Join-Path $PSScriptRoot "extract_public_publish_summary.py"
    if ($script:pyExe -and (Test-Path -LiteralPath $extractor)) {
      # PowerShell 5.1 ConvertFrom-Json 은 ROE/roe 중복키에서 실패하므로 Python 으로 평탄 요약을 받는다.
      $raw = & $script:pyExe @script:pyPre $extractor (Join-Path $Repo $PublicRel) 2>$null
      if ($LASTEXITCODE -eq 0 -and $raw) { $sum = ($raw | Out-String).Trim() | ConvertFrom-Json }
    }
    $o = [ordered]@{
      verdict                = $Verdict
      project                = "wababa"
      stage                  = "AUTO_PUBLISH"
      status                 = $Status
      runAt                  = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
      ledgerBasisDate        = if ($sum) { $sum.ledgerBasisDate } else { $null }
      priceBasisDate         = if ($sum) { $sum.priceBasisDate } else { $null }
      priceFreshnessStatus   = if ($sum) { $sum.priceFreshnessStatus } else { $null }
      officialSequence       = if ($sum) { $sum.officialSequence } else { $null }
      uniqueHoldings         = if ($sum) { $sum.uniqueHoldings } else { $null }
      totalLots              = if ($sum) { $sum.totalLots } else { $null }
      totalBuyCount          = if ($sum) { $sum.totalBuyCount } else { $null }
      totalSellCount         = if ($sum) { $sum.totalSellCount } else { $null }
      totalAsset             = if ($sum) { $sum.totalAsset } else { $null }
      availableCash          = if ($sum) { $sum.availableCash } else { $null }
      latestTradeDate        = if ($sum) { $sum.latestTradeDate } else { $null }
      latestBuyCount         = if ($sum) { $sum.latestBuyCount } else { $null }
      latestSellCount        = if ($sum) { $sum.latestSellCount } else { $null }
      publicChanged          = $PublicChanged
      commit                 = $CommitHash
      pushed                 = $Pushed
      deployTrigger          = if ($Pushed) { "vercel-auto-on-push" } else { "none" }
      realOrderCount         = 0
      brokerApiCallCount     = 0
      smtpCallCount          = 0
      reason                 = $Reason
      founderAction          = $FounderAction
    }
    $o | ConvertTo-Json -Depth 5 | Out-File -FilePath $StatusJson -Encoding utf8
    # .md 첫 줄은 반드시 판정 헤더(Report Bridge 가 UNKNOWN 대신 판정을 파싱).
    $md = @()
    $md += "전체 판정: $Verdict"
    $md += ""
    $md += "[프로젝트] 와바바"
    $md += "[제목] 홈페이지 공개 데이터 자동반영 (Wababa Auto Publish)"
    $md += "[실행 시각] $($o.runAt) KST"
    $md += "[홈페이지 반영] $Status"
    $md += "[장부 기준일] $($o.ledgerBasisDate)"
    $md += "[평가가격 기준일] $($o.priceBasisDate)"
    $md += "[seq] $($o.officialSequence) · 고유 보유종목 $($o.uniqueHoldings) · 누적 lot $($o.totalLots)"
    $md += "[commit] $(if($CommitHash){$CommitHash}else{'없음'}) · push $(if($Pushed){'완료'}else{'없음'})"
    $md += "[실주문] 0"
    $md += "[브로커 호출] 0"
    if ($Reason) { $md += "[사유] $Reason" }
    $md += "[대장이 할 일] $FounderAction"
    $md -join "`r`n" | Out-File -FilePath $StatusMd -Encoding utf8
  } catch {
    Write-Host ("[WARN] publish status 기록 실패(본 작업 영향 없음): {0}" -f $_.Exception.Message)
  }
}

function Stop-Fail([string]$msg) {
  $line = "[{0}] FAIL: {1}" -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'), $msg
  Write-Host $line
  Add-Content -Path $LogPath -Value $line -Encoding utf8
  Add-Content -Path $ErrPath -Value $line -Encoding utf8
  $code = if ($msg -match '^(BLOCKED_[A-Z_]+)') { $Matches[1] } else { "BLOCKED_PUBLISH" }
  Write-PublishStatus -Status $code -Verdict "BLOCKED" -Reason $msg -FounderAction "원인 확인 후 Wababa Auto Publish 재실행"
  exit 1
}

Set-Location $Repo
$env:PYTHONIOENCODING = "utf-8"

# 0) Python 인터프리터 견고 해결. 못 찾으면 명확한 BLOCKED + non-zero exit(숨기지 않음).
#    -ResolveOnly: 해결만 확인하고 종료(gate/stage/commit/push 없음, write 0).
try {
  $pyInvoker = Resolve-PythonInvoker
  $pyExe = $pyInvoker.Exe
  $pyPre = $pyInvoker.Pre
} catch {
  if ($ResolveOnly) { Write-Host ("PYTHON_INVOKER_FAIL: {0}" -f $_.Exception.Message); exit 1 }
  Stop-Fail ("BLOCKED_PYTHON_INTERPRETER - {0}" -f $_.Exception.Message)
}
if ($ResolveOnly) {
  Write-Host ("PYTHON_INVOKER_OK: {0} {1}" -f $pyExe, ($pyPre -join ' '))
  exit 0
}

Write-Log "=== Wababa Auto Publish 시작 (Commit=$Commit Push=$Push) ==="
Write-Log "python interpreter: $pyExe $($pyPre -join ' ')"

# 1) 브랜치 확인
$branch = (& git rev-parse --abbrev-ref HEAD 2>$null).Trim()
if ($branch -ne "master") { Stop-Fail "현재 브랜치가 master가 아님: '$branch'" }

# 2) freshness gate (미반영은 publish 대상이므로 --allow-unpublished)
& $pyExe @pyPre scripts\qa\check_public_data_freshness.py --allow-unpublished
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

# 5) public JSON 변경 없으면 정상 종료 (거래일이 아니거나 canonical 이 이미 반영된 상태)
if (-not $publicChanged) {
  Write-Log "public JSON 변경 없음 - 작업 종료(정상)"
  Write-PublishStatus -Status "NO_CHANGE" -Verdict "PASS" -Reason "public JSON 변경 없음(이미 최신)"
  exit 0
}
Write-Log "public JSON 변경 감지"

# 6) origin/master 동기화 상태 - diverged/behind 차단
& git fetch origin master --quiet 2>$null
if ($LASTEXITCODE -ne 0) { Stop-Fail "git fetch 실패 - 네트워크/자격증명 확인" }
$counts = (& git rev-list --left-right --count origin/master...HEAD).Trim() -split '\s+'
$behind = [int]$counts[0]
$ahead  = [int]$counts[1]
if ($behind -gt 0) { Stop-Fail "로컬이 origin/master보다 $behind 커밋 뒤처짐(diverged) - 수동 동기화 필요" }
Write-Log "origin 동기화 상태 OK (behind=$behind ahead=$ahead)"

if (-not $Commit) {
  Write-Log "검사 통과 (Commit 미지정) - stage/commit 생략, 종료"
  Write-PublishStatus -Status "NO_CHANGE" -Verdict "PASS" -PublicChanged $true `
    -Reason "검사 전용 실행(-Commit 미지정) - 변경 감지했으나 commit 생략"
  exit 0
}

# 7) 단일 파일 stage + 검증 (git 기준 slash 상대경로 사용)
& git add -- $PublicRel
if ($LASTEXITCODE -ne 0) { Stop-Fail "git add 실패 (exit $LASTEXITCODE): $PublicRel" }

$staged = @(& git diff --cached --name-only | ForEach-Object { ($_ -replace '\\','/').Trim() } | Where-Object { $_ })

if ($staged.Count -eq 0) {
  # core.autocrlf=true 환경에서는 working tree가 CRLF여도 정규화 후 내용이 index와
  # 동일하면 git add가 아무것도 stage하지 않는다(= 실제 내용 변경 없음, EOL/stat 차이만).
  # 이는 에러가 아니라 "오늘 새로 배포할 변경 없음"이므로 커밋 없이 정상 종료한다.
  $diag = (& git status --porcelain -- $PublicRel) -join ' | '
  $eol  = (& git ls-files --eol -- $PublicRel) -join ' | '
  Write-Log "stage 결과 비어 있음 - 실제 내용 변경 없음(EOL/stat 차이로 추정). 커밋 없이 정상 종료."
  Write-Log "진단: status=[$diag] eol=[$eol]"
  Write-PublishStatus -Status "NO_CHANGE" -Verdict "PASS" `
    -Reason "실제 내용 변경 없음(EOL/stat 차이) - 커밋 없이 정상 종료"
  exit 0
}

if ($staged.Count -ne 1 -or $staged[0] -ne $PublicRel) {
  # public JSON 외 다른 파일이 staged됨 - 안전 중단(자동 reset 하지 않음).
  Stop-Fail "staged가 public JSON 단일 파일이 아님: [$($staged -join ', ')]"
}
Write-Log "staged 확인: $PublicRel (1개)"

# 8) baseDate 기반 commit 메시지
$baseDate = (& $pyExe @pyPre -c "import json,io;print(json.load(io.open(r'public/data/recommendation-history.json',encoding='utf-8')).get('baseDate',''))").Trim()
$commitMsg = "chore(data): refresh public recommendation history $baseDate".Trim()
& git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) { Stop-Fail "git commit 실패" }
$hash = (& git rev-parse --short HEAD).Trim()
Write-Log "commit 완료: $hash ($commitMsg)"

if (-not $Push) {
  Write-Log "Push 미지정 - push 생략, 종료"
  Write-PublishStatus -Status "NO_CHANGE" -Verdict "PASS" -PublicChanged $true -CommitHash $hash `
    -Reason "commit 완료·push 미지정(배포 없음)"
  exit 0
}

# 9) push (재시도 없음). push 성공 시에만 Vercel Git 연동 자동배포가 걸린다.
& git push origin master
if ($LASTEXITCODE -ne 0) {
  Stop-Fail "BLOCKED_PUSH_FAILED - git push 실패. Git Credential Manager 로그인 필요할 수 있음. 재시도 안 함(commit은 로컬에 남음: $hash)."
}
Write-Log "push 완료: origin/master <- $hash"
Write-PublishStatus -Status "PUBLISHED" -Verdict "PASS" -PublicChanged $true -CommitHash $hash -Pushed $true `
  -Reason "public 데이터 commit·push 완료 - Vercel 자동배포 트리거"
Write-Log "=== Wababa Auto Publish 정상 종료 ==="
exit 0
