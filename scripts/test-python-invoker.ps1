# test-python-invoker.ps1  (READ-ONLY regression for the exit-9009 fix)
# Verifies run-wababa-auto-daily.ps1 resolves a real Python interpreter and does
# NOT depend on the broken WindowsApps 'python' alias. Uses -ResolveOnly, so the
# build pipeline (build_recommendation_history.py) and any data write are NOT run.
# ASCII-only on purpose (target script has no UTF-8 BOM).
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File <...>\test-python-invoker.ps1

$ErrorActionPreference = "Continue"

$runner = Join-Path $PSScriptRoot "run-wababa-auto-daily.ps1"
$fail = 0
function Check($name, [bool]$cond) {
  if ($cond) { Write-Host ("  PASS  {0}" -f $name) -ForegroundColor DarkGray }
  else { Write-Host ("  FAIL  {0}" -f $name) -ForegroundColor Red; $script:fail++ }
}

Write-Host "=== test-python-invoker (exit-9009 fix) ===" -ForegroundColor Cyan
Check "runner 존재" (Test-Path -LiteralPath $runner)

# 1) -ResolveOnly: 인터프리터 해결만(파이프라인/데이터 쓰기 없음), exit 0 + 실제 python.
$out = & powershell -NoProfile -ExecutionPolicy Bypass -File $runner -ResolveOnly 2>&1
$code = $LASTEXITCODE
$outStr = ($out | Out-String)
Check "-ResolveOnly exit 0"                 ($code -eq 0)
Check "PYTHON_INVOKER_OK 출력"              ($outStr -match "PYTHON_INVOKER_OK")
Check "WindowsApps 스텁이 아님(실제 해결)"  (-not ($outStr -match "PYTHON_INVOKER_OK:.*\\WindowsApps\\"))

# 2) 재현: bare 'python' 은 이 호스트에서 깨진 앱실행 별칭(스텁) -> 정상 버전 못 냄.
$bareOk = $false
try { $bv = & python --version 2>&1; if ($LASTEXITCODE -eq 0 -and ("$bv" -match "Python\s+\d")) { $bareOk = $true } } catch {}
Check "재현: bare python 은 정상 버전 미출력(스텁/미해결)" (-not $bareOk)

# 3) py -3 런처는 실제 인터프리터로 동작(견고 경로).
$pyOk = $false
try { $pv = & py -3 --version 2>&1; if ($LASTEXITCODE -eq 0 -and ("$pv" -match "Python\s+3")) { $pyOk = $true } } catch {}
Check "py -3 는 실제 Python 3 해결" $pyOk

# 4) 해결된 인터프리터로 무해한 스크립트 실행 가능(부작용 없는 -c).
$trivialOk = $false
try { $t = & py -3 -c "print('ok')" 2>&1; if ($LASTEXITCODE -eq 0 -and ("$t" -match "ok")) { $trivialOk = $true } } catch {}
Check "해결 인터프리터로 무해 실행 OK" $trivialOk

Write-Host ""
if ($fail -eq 0) { Write-Host "OVERALL: PASS (0 fail)" -ForegroundColor Green; exit 0 }
else { Write-Host ("OVERALL: FAIL ({0} fail)" -f $fail) -ForegroundColor Red; exit 1 }
