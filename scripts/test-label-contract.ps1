# test-label-contract.ps1
# WABABA-DASHBOARD-TRADING-DAY-LABEL-CORRECTION — 표시 라벨·값 매핑 계약 회귀 테스트.
#
# 배경: officialSequence(=자동반영 회차)를 '거래일/운용일'로 표시해 실제 경과 거래일
#       (officialTradingDayIndex)과 혼동됐다. 값 자체는 맞지만 라벨이 다른 의미를 뜻했다.
#   officialSequence        19 = 공식이 실제 반영(실행)한 거래일 수 = 회차 = 배치 수
#   officialTradingDayIndex 21 = 시작 이후 경과한 KRX 실거래일 수(미실행 2일 포함)
#   dataDate/executionDate     = 최신 가상 장부가 반영된 실제 거래일
#
# 방식: 소스 정적 검사(라벨 매핑) + 실제 public payload 값으로 의미 대조. 서버·네트워크 불필요.
# 사용: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\test-label-contract.ps1

$ErrorActionPreference = "Continue"
$pass = 0; $fail = 0
function Check([string]$Name, $Actual, $Expected) {
  if ("$Actual" -eq "$Expected") { $script:pass++; Write-Host "  PASS  $Name" }
  else { $script:fail++; Write-Host "  FAIL  $Name  expected=$Expected actual=$Actual" }
}

$repo = "C:\work\kr-stock-agent"
$magic = Join-Path $repo "app\_dashboard\magic-official.tsx"
$perf  = Join-Path $repo "app\performance\page.tsx"
$rank  = Join-Path $repo "app\magic-formula\rankings\page.tsx"
$lab   = Join-Path $repo "app\strategy-lab\page.tsx"
$funds = Join-Path $repo "app\_dashboard\funds.tsx"

Write-Host "=== 와바바 표시 라벨 계약 회귀 테스트 ==="

# ── 1) sequence 를 '일차/운용일' 로 표시하지 않는다 ──────────────────────────
Write-Host "[1] sequence 라벨 (회차로 표기)"
$mRaw = Get-Content -Raw -LiteralPath $magic -Encoding UTF8
$pRaw = Get-Content -Raw -LiteralPath $perf  -Encoding UTF8
$rRaw = Get-Content -Raw -LiteralPath $rank  -Encoding UTF8
$lRaw = Get-Content -Raw -LiteralPath $lab   -Encoding UTF8

Check "magic: officialSequence 를 '일차' 로 표시하지 않음" ($mRaw -match 'officialSequence\}일차') $false
Check "magic: 상태 스트립에 '자동반영 …회차'"              ($mRaw -match '자동반영 \{summary\.officialSequence\}회차') $true
Check "magic: OMetric 라벨이 '자동반영 회차'"              ($mRaw -match 'label="자동반영 회차"') $true
Check "magic: OMetric 값이 '…회'(일 아님)"                 ($mRaw -match 'label="자동반영 회차" value=\{`\$\{summary\.officialSequence\}회`\}') $true
Check "magic: '운용일' 수치 라벨 없음"                     ($mRaw -match 'label="운용일"') $false
Check "perf: '운용일 N' 표기 없음"                         ($pRaw -match '운용일 \{magicDays\.length\}') $false
Check "perf: '자동반영 N회차' 표기"                        ($pRaw -match '자동반영 \{magicDays\.length\}회차') $true
Check "perf: '고유 보유종목' 라벨"                         ($pRaw -match '고유 보유종목 \{holdings\.length\}') $true
Check "rankings: '회차 기준' 표기"                         ($rRaw -match '\{seq\}회차 기준') $true
Check "rankings: '일차 기준' 없음"                         ($rRaw -match '\{seq\}일차 기준') $false
Check "strategy-lab: '운용일' 집계 표기 없음"              ($lRaw -match '\}운용일`') $false
Check "strategy-lab: '회차' 집계 표기"                     ($lRaw -match '\}회차`') $true

# ── 2) 평가가격 기준일은 공식 펀드 자신의 장부 기준일(종가) ─────────────────
#   페이지 최상위 priceAsOf 는 08:45 파이프라인 값이라 한 거래일 뒤처진다.
Write-Host "[2] 평가가격 기준일 소스"
Check "magic: 평가가격 기준일이 summary.dataDate 파생" ($mRaw -match 'const evalPriceBasis = summary\.dataDate') $true
Check "magic: 평가가격 기준일에 priceAsOf 직접 사용 안 함" ($mRaw -match '평가가격 기준일 \{fmtDate\(priceBasis\)\}') $false
Check "magic: '종가' 기준 명시"                            ($mRaw -match '평가가격 기준일 \{fmtDate\(evalPriceBasis\)\} 종가') $true
Check "magic: 장부 밀림 판정은 계속 실제 거래일 기준"      ($mRaw -match 'const latestMarketDate = latestTradingDate\(history\)') $true

# ── 3) lot 수를 보유종목 수로 표시하지 않는다 ───────────────────────────────
Write-Host "[3] 고유 보유종목 vs 누적 lot 분리"
$fRaw = Get-Content -Raw -LiteralPath $funds -Encoding UTF8
Check "funds: holdingCount 가 openItemLotCount 아님" ($fRaw -match 'holdingCount: num\(off\.openItemLotCount\)') $false
Check "funds: holdingCount 가 고유 holdings 길이"     ($fRaw -match 'holdingCount: arr\(obj\(history\.magicOfficialPortfolio\)\.holdings\)\.length') $true
Check "magic: 보유 종목과 lot 분리 표기 유지"        ($mRaw -match 'label="보유 종목"[\s\S]{0,120}lot \$\{summary\.openItemLotCount\}개') $true

# ── 4) 실제 public payload 값과 의미 대조 ───────────────────────────────────
#   PowerShell 5.1 ConvertFrom-Json 은 ROE/roe 중복키에서 실패하므로 Python 으로 요약을 받는다.
Write-Host "[4] public payload 값 대조"
$pubPath = Join-Path $repo "public\data\recommendation-history.json"
$canonPath = "C:\work\kr-stock-agent-data-new\magic-formula-official-state.json"
$py = $null
foreach ($c in @(Get-Command py -CommandType Application -All -ErrorAction SilentlyContinue |
                 Where-Object { $_.Source -notmatch '\\WindowsApps\\' })) { $py = $c.Source; break }
if ($py -and (Test-Path $pubPath)) {
  $expr = "import json;d=json.load(open(r'$pubPath',encoding='utf-8'));s=d['magicOfficialSummary'];" +
          "h=(d.get('magicOfficialPortfolio') or {}).get('holdings') or [];" +
          "print(s['officialSequence'],len(h),s['openItemLotCount'],s['dataDate'],d.get('priceAsOf'))"
  $out = (& $py -3 -c $expr 2>$null | Out-String).Trim() -split '\s+'
  if ($out.Count -ge 5) {
    $seq = [int]$out[0]; $uniq = [int]$out[1]; $lots = [int]$out[2]; $dataDate = $out[3]; $priceAsOf = $out[4]
    Write-Host ("    payload: seq=$seq uniqueHoldings=$uniq lots=$lots dataDate=$dataDate priceAsOf=$priceAsOf")
    Check "고유 보유종목 수 < 누적 lot 수 (혼동 시 동일해짐)" ($uniq -lt $lots) $true
    Check "누적 lot == 회차 x 10 (일별 10종목 매수 규칙)"      ($lots -eq ($seq * 10)) $true
    # 같은 날일 수도 있으나, priceAsOf 가 dataDate 보다 앞설 수는 없다(미래 시세 불가).
    Check "priceAsOf <= dataDate (평가일이 장부일보다 미래 아님)" ($priceAsOf -le $dataDate) $true
  } else { Write-Host "  SKIP  payload 파싱 실패(구조 확인 필요)" }
  # canonical 이 있으면 sequence != tradingDayIndex 를 실증(둘을 같은 뜻으로 쓰면 안 되는 이유)
  if (Test-Path $canonPath) {
    $expr2 = "import json;st=json.load(open(r'$canonPath',encoding='utf-8'));" +
             "print(st['officialSequence'],st['officialTradingDayIndex'])"
    $o2 = (& $py -3 -c $expr2 2>$null | Out-String).Trim() -split '\s+'
    if ($o2.Count -ge 2) {
      Write-Host ("    canonical: officialSequence=$($o2[0]) officialTradingDayIndex=$($o2[1])")
      Check "sequence != tradingDayIndex (서로 다른 개념)" ([int]$o2[0] -ne [int]$o2[1]) $true
    }
  }
} else { Write-Host "  SKIP  python 또는 public payload 없음" }

Write-Host ""
Write-Host "결과: PASS $pass / FAIL $fail"
Write-Host ("verdict: " + $(if ($fail -eq 0) { "PASS" } else { "FAIL" }))
exit $(if ($fail -eq 0) { 0 } else { 1 })
