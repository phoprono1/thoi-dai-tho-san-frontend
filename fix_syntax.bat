@echo off
cd /d f:\VKU\self_project\Game\thoi-dai-tho-san\frontend
powershell -ExecutionPolicy Bypass -Command "$content = Get-Content 'src/components/admin/AdminQuests.tsx'; $content[949] = $content[949] -replace '\);$', ')'; $content | Set-Content 'src/components/admin/AdminQuests.tsx'"
