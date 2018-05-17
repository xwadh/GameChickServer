@echo 启动主进程 - 根据配置文件 >nul
pm2 startOrRestart game.config.js & pm2 monit
