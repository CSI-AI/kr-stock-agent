@echo off
REM Wababa - 공개 데이터 원클릭 publish (Phase 41-C)
REM publish-public-data.ps1 을 -Commit -Push 로 1회 실행한다.
REM 더블클릭으로 실행 가능. 실패해도 창이 바로 닫히지 않도록 pause.

setlocal
set REPO=C:\work\kr-stock-agent

echo ================================================
echo  Wababa 공개 데이터 publish (commit + push)
echo ================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%REPO%\scripts\ops\publish-public-data.ps1" -Commit -Push
set RC=%ERRORLEVEL%

echo.
if "%RC%"=="0" (
  echo [완료] 종료 코드 0 ^(정상^)
) else (
  echo [실패] 종료 코드 %RC% - logs\wababa-auto-publish-error.log 확인
)
echo.
pause
endlocal
exit /b %RC%
