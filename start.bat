@echo off
chcp 65001 >nul
echo.
echo  心动雷达 · 本地预览启动中...
echo  浏览器将自动打开 http://localhost:8000
echo  按 Ctrl+C 关闭服务器
echo.
start "" http://localhost:8000
python -m http.server 8000
