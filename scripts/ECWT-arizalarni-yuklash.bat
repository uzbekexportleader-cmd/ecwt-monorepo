@echo off
chcp 65001 >nul
title ECWT - arizalarni yuklash

rem Bu faylni istalgan joyga ko'chirsa ham ishlaydi: loyiha yo'li ichida yozilgan.
cd /d D:\ecwt
node scripts\arizalarni-yuklash.mjs

echo.
echo Yopish uchun istalgan tugmani bosing...
pause >nul
