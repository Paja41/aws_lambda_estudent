@echo off
REM ================================================================
REM  deploy.bat - jedan-klik deploy celog AWS stack-a (Windows)
REM  Pokreni iz root-a projekta:  cloud\deploy.bat
REM ================================================================
setlocal

echo.
echo ==== [1/4] SAM build ====
call sam build --template cloud/template.yaml
if errorlevel 1 goto :error

echo.
echo ==== [2/4] SAM deploy ====
call sam deploy
if errorlevel 1 goto :error

echo.
echo ==== [3/4] Build frontenda ====
call npm run build
if errorlevel 1 goto :error

echo.
echo ==== [4/4] Sync na S3 ====
call aws s3 sync dist/ s3://estudent-prijave-frontend/ --delete
if errorlevel 1 goto :error

echo.
echo ================================================================
echo  GOTOVO! Sajt je ziv na:
echo  http://estudent-prijave-frontend.s3-website.eu-north-1.amazonaws.com
echo ================================================================
goto :end

:error
echo.
echo !!! GRESKA - neki korak nije prosao. Pogledaj poruku iznad. !!!

:end
endlocal
pause
