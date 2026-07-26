# resolve-python-invoker.ps1  (shared helper; dot-source this file)
#
# Single definition of Resolve-PythonInvoker, extracted verbatim from
# run-wababa-auto-daily.ps1 (commit 48bfec6) so every scheduled wrapper shares
# ONE verified implementation instead of copying it. Dot-source with:
#   . (Join-Path $PSScriptRoot "resolve-python-invoker.ps1")
#
# ---------------------------------------------------------------------------
# Resolve-PythonInvoker  (fix for Task Scheduler exit 9009)
#   Root cause: bare 'python' on this host resolves only to the 0-byte
#   WindowsApps App-Execution-Alias stub, which is NOT resolvable in the
#   non-interactive Scheduled Task context -> 'python' not found -> exit 9009.
#   Fix: prefer the 'py' launcher (always in C:\Windows, works non-interactively
#   and locates the real install), then a real python.exe that is NOT the
#   WindowsApps stub. Throw loudly if none works (never hide the error, never
#   force exit 0). ASCII-only on purpose (callers have no UTF-8 BOM).
# ---------------------------------------------------------------------------
function Resolve-PythonInvoker {
  # Returns @{ Exe = <path>; Pre = <string[]> } to invoke Python robustly.
  # NOTE: Get-Command can return BOTH the real exe and a WindowsApps alias of the
  # same name, so filter WindowsApps in both branches and iterate candidates.

  # 1) 'py' launcher (real C:\Windows\py.exe; skip WindowsApps alias). Most
  #    reliable in the non-interactive Scheduled Task context (system PATH).
  foreach ($py in @(Get-Command py -CommandType Application -All -ErrorAction SilentlyContinue |
                    Where-Object { $_.Source -notmatch '\\WindowsApps\\' })) {
    try {
      $null = & $py.Source -3 --version 2>&1
      if ($LASTEXITCODE -eq 0) { return @{ Exe = $py.Source; Pre = @('-3') } }
    } catch {}
  }
  # 2) real python.exe on PATH (skip the 0-byte WindowsApps app-exec alias stub).
  foreach ($cmd in @(Get-Command python -CommandType Application -All -ErrorAction SilentlyContinue)) {
    if ($cmd.Source -match '\\WindowsApps\\') { continue }
    try {
      if ((Get-Item -LiteralPath $cmd.Source).Length -gt 0) {
        $null = & $cmd.Source --version 2>&1
        if ($LASTEXITCODE -eq 0) { return @{ Exe = $cmd.Source; Pre = @() } }
      }
    } catch {}
  }
  throw "No working Python interpreter found. Need 'py -3' launcher or a real python.exe (not the WindowsApps alias). This is the cause of exit 9009 under Task Scheduler."
}
