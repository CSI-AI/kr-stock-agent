# test-wababa-source-encoding.ps1  (READ-ONLY regression)
#
# 고정하려는 것 (2026-08-12 실측 결함):
#   08:40 Founder 종합보고 62행의 "대장이 할 일" 이 이렇게 나갔다 —
#     "Auto Apply 媛 ?꾩쭅 lock 蹂댁쑀 以????숈떆 publish 湲덉?(?ㅼ쓬 ?ъ떆?꾩뿉???뺤씤)"
#   원천은 AI 운영실이 아니라 이 저장소다.
#
#   원인: PS 5.1 은 자식 프로세스 stdout 을 [Console]::OutputEncoding 으로 디코딩한다.
#   publish-public-data.ps1 / run-wababa-auto-daily.ps1 이 PYTHONIOENCODING=utf-8 로
#   Python 에 UTF-8 출력을 시키면서 콘솔 인코딩은 맞추지 않아, 비대화형 스케줄러 기본값
#   (CP949)으로 읽혀 **캡처 순간** 한글이 깨진 뒤 상태 JSON 에 저장됐다.
#
#   피해 2종:
#     ① Founder 행동 문구 판독 불가
#     ② CP949 lead byte 가 뒤따르는 '"' 를 삼켜 gate JSON 파싱까지 실패 →
#        진짜 decision·founderAction 이 사라지고 일반 fallback 으로 기록
#
#   부수 결함: run-wababa-auto-daily.ps1 에 UTF-8 BOM 이 없어 **자기 소스의 한글 리터럴**도
#   CP949 로 파싱돼 깨진 채 결과 JSON 에 저장됐다.
#
# 부작용 0: 실주문 0 · 브로커 호출 0 · 외부 publish 0 · 배포 0 · 파일 write 0(임시폴더만).
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File <...>\test-wababa-source-encoding.ps1

$ErrorActionPreference = "Continue"

$runner    = Join-Path $PSScriptRoot "run-wababa-auto-daily.ps1"
$publisher = Join-Path $PSScriptRoot "ops\publish-public-data.ps1"
$gate      = "C:\work\kr-stock-agent-data-new\scripts\magic_publish_gate.py"

$fail = 0
function Check($name, [bool]$cond) {
  if ($cond) { Write-Host ("  PASS  {0}" -f $name) -ForegroundColor DarkGray }
  else { Write-Host ("  FAIL  {0}" -f $name) -ForegroundColor Red; $script:fail++ }
}
function Skip($name, $why) { Write-Host ("  SKIP  {0}  ({1})" -f $name, $why) -ForegroundColor Yellow }

# mojibake 결정적 신호(추론 없음). AI 운영실 Test-FounderTextIntegrity 와 같은 3종.
function Test-Mojibake([string]$Text) {
  $t = "$Text"
  if ($t -eq "") { return $false }
  if ($t.IndexOf([char]0xFFFD) -ge 0) { return $true }
  if ($t -match '\?\?') { return $true }
  if ($t -match '\?[가-힣]') { return $true }
  return $false
}

# 자식 프로세스 stdout 을 지정한 콘솔 인코딩으로 캡처한다(운영 코드와 동일한 방식).
function Invoke-Capture([int]$CodePage, [string]$PyExe, [string[]]$PyPre, [string[]]$PyArgs) {
  $orig = [Console]::OutputEncoding
  try {
    [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding($CodePage)
    $raw = & $PyExe @PyPre @PyArgs 2>&1
    return [pscustomobject]@{ Text = ($raw | Out-String).Trim(); Exit = $LASTEXITCODE }
  } finally { [Console]::OutputEncoding = $orig }
}

Write-Host "=== test-wababa-source-encoding ===" -ForegroundColor Cyan

. (Join-Path $PSScriptRoot "resolve-python-invoker.ps1")
$inv = $null
try { $inv = Resolve-PythonInvoker } catch {}
$env:PYTHONIOENCODING = "utf-8"

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("wababa-enc-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
try {

  Write-Host "--- A. 원인 재현: 손상 문자열이 실제 소스 문구와 대응하는가 ---" -ForegroundColor Cyan
  # magic_publish_gate.py 의 BLOCKED_APPLY_IN_PROGRESS reason 원문(소스에서 직접 읽는다).
  $gateSrcOk = Test-Path -LiteralPath $gate
  Check "gate 스크립트 존재" $gateSrcOk
  $sourceReason = ""
  if ($gateSrcOk) {
    $gateText = [System.IO.File]::ReadAllText($gate, [System.Text.UTF8Encoding]::new($false))
    $m = [regex]::Match($gateText, 'reason="(Auto Apply [^"]*lock[^"]*)"')
    if ($m.Success) { $sourceReason = $m.Groups[1].Value }
  }
  Check "소스에서 lock reason 원문 추출" ($sourceReason -ne "")
  if ($sourceReason -ne "") {
    # UTF-8 로 낸 바이트를 CP949 로 읽으면 무슨 일이 나는지 = 결함 그 자체.
    $reproduced = [System.Text.Encoding]::GetEncoding(949).GetString([System.Text.Encoding]::UTF8.GetBytes($sourceReason))
    Check "CP949 디코딩이 mojibake 를 만든다(재현)" (Test-Mojibake $reproduced)
    # 2026-08-12 보고서 62행에 실제로 찍힌 문자열의 결정적 지문과 대응하는지.
    #   가(U+AC00) = UTF-8 EA B0 80 → CP949 가 EA B0 을 媛(U+5A9B) 로 읽고 남은 80 은
    #   U+0080 제어문자로 떨어진다(눈에 안 보이는 자국 — 원복 불가의 증거).
    #   보유 → 蹂(U+8E42) 댁(U+B301) 쑀(U+C440).
    Check "관측 지문 ① 길이 63"        ($reproduced.Length -eq 63)
    Check "관측 지문 ② 'Auto Apply 媛'" ($reproduced.StartsWith("Auto Apply " + [char]0x5A9B))
    Check "관측 지문 ③ lone byte 자국"  ($reproduced.IndexOf([char]0x0080) -ge 0)
    Check "관측 지문 ④ '보유' 손상형"   ($reproduced.Contains([string][char]0x8E42 + [char]0xB301 + [char]0xC440))
    Check "원문 자체는 정상(mojibake 아님)" (-not (Test-Mojibake $sourceReason))
  }

  if (-not $inv) { Skip "B~C 캡처 검증" "python 미해결"; }
  else {
    $pyExe = $inv.Exe; $pyPre = $inv.Pre

    Write-Host "--- B. 캡처 단위 회귀 ---" -ForegroundColor Cyan

    # 1) 정상 한글 stdout
    $s1 = Join-Path $tmp "korean.py"
    "print('\uac00\uaca9 \ubcf4\uc720 \uc911 \u2014 \ub3d9\uc2dc publish \uae08\uc9c0')" |
      Out-File -FilePath $s1 -Encoding utf8
    $r1u = Invoke-Capture 65001 $pyExe $pyPre @($s1)
    $r1c = Invoke-Capture 949   $pyExe $pyPre @($s1)
    Check "1) 한글 stdout — UTF-8 캡처 정상"        (-not (Test-Mojibake $r1u.Text))
    Check "1) 한글 stdout — UTF-8 캡처 내용 보존"   ($r1u.Text.Contains("보유 중"))
    Check "1) 한글 stdout — CP949 캡처는 깨진다(재현)" (Test-Mojibake $r1c.Text)

    # 2) ASCII stdout — 기존 정상 경로가 인코딩 변경에 영향받지 않는다
    $s2 = Join-Path $tmp "ascii.py"
    "print('PROCEED exit=0 seq=28')" | Out-File -FilePath $s2 -Encoding utf8
    $r2u = Invoke-Capture 65001 $pyExe $pyPre @($s2)
    $r2c = Invoke-Capture 949   $pyExe $pyPre @($s2)
    Check "2) ASCII stdout — UTF-8/CP949 결과 동일(비회귀)" ($r2u.Text -eq $r2c.Text)
    Check "2) ASCII stdout — 내용 보존" ($r2u.Text -eq "PROCEED exit=0 seq=28")

    # 3) JSON stdout 안의 한글 reason/message
    $s3 = Join-Path $tmp "json_korean.py"
    @'
import json
print(json.dumps({"decision": "BLOCKED_APPLY_IN_PROGRESS",
                  "reason": "\uc0c1\ud0dc \uba54\uc2dc\uc9c0",
                  "founderAction": "\uc5c6\uc74c(\uc7ac\uc2dc\ub3c4 \ub300\uae30)"}, ensure_ascii=False))
'@ | Out-File -FilePath $s3 -Encoding utf8
    $r3u = Invoke-Capture 65001 $pyExe $pyPre @($s3)
    $j3 = $null; try { $j3 = $r3u.Text | ConvertFrom-Json } catch {}
    Check "3) JSON 한글 — UTF-8 캡처 파싱 OK" ($null -ne $j3)
    if ($j3) {
      Check "3) JSON 한글 — reason 보존"        ($j3.reason -eq "상태 메시지")
      Check "3) JSON 한글 — founderAction 보존" (-not (Test-Mojibake $j3.founderAction))
    }

    # 4)+5) 실제 gate 실행 — 실패 reason / lock·apply-in-progress reason 계열 (read-only, write 0)
    if (-not $gateSrcOk) { Skip "4~5) 실제 gate 캡처" "gate 스크립트 없음" }
    else {
      $g = Invoke-Capture 65001 $pyExe $pyPre @($gate)
      $gj = $null; try { $gj = $g.Text | ConvertFrom-Json } catch {}
      Check "4) 실제 gate — UTF-8 캡처 JSON 파싱 OK" ($null -ne $gj)
      if ($gj) {
        Check "4) 실제 gate — decision 이 살아있다"   ("$($gj.decision)" -match '^[A-Z_]+$')
        Check "4) 실제 gate — reason 한글 정상"       (-not (Test-Mojibake "$($gj.reason)"))
        Check "4) 실제 gate — founderAction 한글 정상" (-not (Test-Mojibake "$($gj.founderAction)"))
        Check "4) 실제 gate — 실주문 0"               ([int]$gj.realOrderCount -eq 0)
        Check "4) 실제 gate — 브로커 호출 0"          ([int]$gj.brokerApiCallCount -eq 0)
        Check "4) 실제 gate — 파일 write 0"           ([int]$gj.filesWritten -eq 0)
      }
      # 같은 gate 를 CP949 로 캡처하면 결함이 재현된다(수정 전 상태 고정).
      $gc = Invoke-Capture 949 $pyExe $pyPre @($gate)
      $gjc = $null; try { $gjc = $gc.Text | ConvertFrom-Json } catch {}
      Check "5) 실제 gate — CP949 캡처는 손상/파싱실패(재현)" ((Test-Mojibake $gc.Text) -or ($null -eq $gjc))

      # 6) 저장 단계 비회귀 — publish-public-data.ps1 의 Write-PublishStatus 와 **동일한 cmdlet 조합**
      #    (ConvertTo-Json | Out-File -Encoding utf8 → Get-Content -Encoding UTF8)으로 왕복시켜
      #    캡처된 한글이 상태 JSON 에 그대로 남는지 고정한다.
      #    (publish 진입점 자체는 운영 deny 대상이라 직접 실행하지 않는다 — 같은 직렬화 경로만 검증.)
      if ($gj) {
        $probe = Join-Path $tmp "status-roundtrip.json"
        $o = [ordered]@{
          verdict       = "BLOCKED"
          status        = "$($gj.decision)"
          reason        = "$($gj.decision) - $($gj.reason)"
          founderAction = "$($gj.founderAction)"
        }
        $o | ConvertTo-Json -Depth 5 | Out-File -FilePath $probe -Encoding utf8
        $back = Get-Content -Raw -LiteralPath $probe -Encoding UTF8 | ConvertFrom-Json
        Check "6) 저장 왕복 — reason 한글 보존"        ($back.reason -eq "$($gj.decision) - $($gj.reason)")
        Check "6) 저장 왕복 — reason mojibake 0"       (-not (Test-Mojibake "$($back.reason)"))
        Check "6) 저장 왕복 — founderAction mojibake 0" (-not (Test-Mojibake "$($back.founderAction)"))
        Check "6) 저장 왕복 — 상태 코드 보존"          ("$($back.status)" -eq "$($gj.decision)")
        Write-Host ("        실측 reason : {0}" -f $back.reason)
        Write-Host ("        실측 action : {0}" -f $back.founderAction)
      }
    }
  }

  Write-Host "--- C. 원천 스크립트 배선 ---" -ForegroundColor Cyan
  foreach ($pair in @(@{ n = "publish-public-data.ps1"; p = $publisher }, @{ n = "run-wababa-auto-daily.ps1"; p = $runner })) {
    $p = $pair.p; $n = $pair.n
    Check ("{0} 존재" -f $n) (Test-Path -LiteralPath $p)
    if (-not (Test-Path -LiteralPath $p)) { continue }
    $bytes = [System.IO.File]::ReadAllBytes($p)
    Check ("{0} UTF-8 BOM 존재(자기 한글 리터럴 보호)" -f $n) ($bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191)
    $text = [System.IO.File]::ReadAllText($p)
    Check ("{0} 가 Console.OutputEncoding 을 UTF-8 로 맞춘다" -f $n) ($text -match '\[Console\]::OutputEncoding\s*=\s*\[System\.Text\.Encoding\]::UTF8')
    # PYTHONIOENCODING 보다 뒤(=첫 캡처 전)에 있어야 의미가 있다.
    $iEnv = $text.IndexOf('PYTHONIOENCODING')
    $iCon = $text.IndexOf('[Console]::OutputEncoding')
    Check ("{0} 콘솔 인코딩 설정이 첫 Python 캡처 전에 온다" -f $n) ($iEnv -ge 0 -and $iCon -gt $iEnv)
    # 주석 줄은 제외한다 — 위 헤더처럼 손상 예시를 **의도적으로 인용**한 주석이 있기 때문이다.
    # 보호 대상은 실제로 출력·저장되는 코드 줄의 한글 리터럴이다.
    $codeLines = @(($text -split "`n") | Where-Object { "$_".TrimStart() -notmatch '^#' })
    $brokenLines = @($codeLines | Where-Object { Test-Mojibake $_ })
    Check ("{0} 코드 줄 한글 리터럴 정상 (손상 {1}행)" -f $n, $brokenLines.Count) ($brokenLines.Count -eq 0)
  }

} finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
if ($fail -eq 0) { Write-Host "OVERALL: PASS (0 fail)" -ForegroundColor Green; exit 0 }
else { Write-Host ("OVERALL: FAIL ({0} fail)" -f $fail) -ForegroundColor Red; exit 1 }
