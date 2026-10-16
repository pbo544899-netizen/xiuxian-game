@echo off
chcp 65001 >nul
title 修仙作弊器：造化聚宝盆
echo =======================================================
echo   正在启动《修仙作弊器：造化聚宝盆》本地测试服务...
echo =======================================================
echo.
start http://localhost:8080/index.html
python -m http.server 8080
pause
