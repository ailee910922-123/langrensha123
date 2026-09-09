# 狼人殺遊戲 - 完整部署指南

## 📋 目錄
1. [快速開始](#快速開始)
2. [環境設置](#環境設置)
3. [後端部署](#後端部署)
4. [前端部署](#前端部署)
5. [本地開發](#本地開發)
6. [生產部署](#生產部署)
7. [故障排除](#故障排除)

---

## 🚀 快速開始

### 最小化設置（5分鐘）

```bash
# 1. 克隆項目
git clone https://github.com/ailee910922-123/langrensha123.git
cd langrensha123

# 2. 後端設置
cd backend
npm install
cp .env.example .env
npm run dev

# 3. 前端設置（新終端窗口）
cd frontend
npm install
echo 'VITE_SOCKET_URL=http://localhost:3001' > .env.local
npm run dev

# 4. 打開瀏覽器
# 前端: http://localhost:5173
```

---

## 🔧 環境設置

### 後端環境變數（backend/.env）

```bash
# 服務器配置
NODE_ENV=development          # development / production
PORT=3001                     # 後端伺服器端口
CORS_ORIGIN=http://localhost:5173  # 前端地址

# 日誌設置
LOG_LEVEL=info                # debug / info / warn / error

# 遊戲配置
DEFAULT_MAX_PLAYERS=6         # 預設最大玩家數
GAME_PHASE_DURATION=60        # 每個遊戲階段的秒數
```

### 前端環境變數（frontend/.env.local）

```bash
# Socket.io 伺服器地址
VITE_SOCKET_URL=http://localhost:3001

# 應用配置
VITE_APP_NAME=狼人殺遊戲
```

### 前端環境變數（生產環境 - frontend/.env.production）

```bash
# Socket.io 伺服器地址（改為您的生產域名）
VITE_SOCKET_URL=https://your-domain.com

VITE_APP_NAME=狼人殺遊戲
```

---

## 📦 後端部署

### 本地開發

```bash
cd backend

# 安裝依賴
npm install

# 設置環境變數
cp .env.example .env
# 編輯 .env 文件設置您的配置

# 開發模式（自動重啟）
npm run dev

# 輸出：
# 🎮 Werewolf Game Server running on port 3001
# Environment: development
# CORS Origin: http://localhost:5173
```

### 生產打包

```bash
cd backend

# 構建 TypeScript
npm run build

# 啟動生產伺服器
NODE_ENV=production npm start
```

### Docker 部署（可選）

```dockerfile
# Dockerfile (backend/Dockerfile)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```bash
# 構建和運行
docker build -t werewolf-backend .
docker run -p 3001:3001 -e NODE_ENV=production werewolf-backend
```

---

## 🎨 前端部署

### 本地開發

```bash
cd frontend

# 安裝依賴
npm install

# 創建環境文件
echo 'VITE_SOCKET_URL=http://localhost:3001' > .env.local

# 開發伺服器（帶熱更新）
npm run dev

# 打開 http://localhost:5173
```

### 生產打包

```bash
cd frontend

# 創建生產環境文件
echo 'VITE_SOCKET_URL=https://your-domain.com' > .env.production

# 構建
npm run build

# 輸出在 dist/ 文件夾
# 上傳 dist 文件夾內容到您的靜態主機（Netlify, Vercel, 等）
```

### Netlify 部署

```bash
# 1. 登錄/創建 Netlify 賬號
npm install -g netlify-cli
netlify login

# 2. 構建前端
cd frontend
npm run build

# 3. 部署
netlify deploy --prod --dir=dist
```

### Vercel 部署

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 部署
cd frontend
vercel --prod
```

### 傳統伺服器部署（Nginx）

```bash
# 1. 構建
cd frontend
npm run build

# 2. 上傳 dist 到伺服器
scp -r dist/* user@your-server:/var/www/werewolf-game/

# 3. 配置 Nginx
```

```nginx
# /etc/nginx/sites-available/werewolf-game
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/werewolf-game;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# 啟用站點
sudo ln -s /etc/nginx/sites-available/werewolf-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 💻 本地開發

### 完整開發環境設置

```bash
# 終端 1 - 後端
cd backend
cp .env.example .env
npm install
npm run dev
# 監聽 http://localhost:3001

# 終端 2 - 前端
cd frontend
echo 'VITE_SOCKET_URL=http://localhost:3001' > .env.local
npm install
npm run dev
# 打開 http://localhost:5173
```

### 開發工具

```bash
# 後端調試
node --inspect-brk ./dist/index.js
# 在 Chrome 打開 chrome://inspect

# 前端類型檢查
cd frontend
npm run type-check  # (可選)

# 代碼格式化
cd frontend
npm run format      # (可選)
```

---

## 🏢 生產部署

### AWS EC2 部署示例

```bash
# 1. SSH 連接到 EC2 實例
ssh -i your-key.pem ec2-user@your-instance-ip

# 2. 安裝 Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 3. 克隆並設置項目
git clone https://github.com/ailee910922-123/langrensha123.git
cd langrensha123

# 4. 後端設置
cd backend
npm install
cp .env.example .env
# 編輯 .env 設置生產配置

# 5. 使用 PM2 管理進程
sudo npm install -g pm2
pm2 start npm --name "werewolf-backend" -- start
pm2 save
pm2 startup

# 6. 前端構建
cd ../frontend
npm install
echo 'VITE_SOCKET_URL=https://your-domain.com' > .env.production
npm run build

# 7. 配置 Nginx 代理前端和後端
# (參考上方 Nginx 配置)
```

### SSL 證書設置（Let's Encrypt）

```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com

# 更新 Nginx 配置
sudo certbot renew --nginx
```

### 監控和日誌

```bash
# 查看 PM2 日誌
pm2 logs werewolf-backend

# 監控進程
pm2 monit

# 查看 Nginx 日誌
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🐛 故障排除

### 前端無法連接到後端

**症狀**：`GET http://localhost:3001 ERR_CONNECTION_REFUSED`

**解決**：
```bash
# 1. 檢查後端是否運行
curl http://localhost:3001/health

# 2. 檢查 CORS 設置（backend/src/index.ts）
# 確保 corsOrigin 正確設置

# 3. 檢查防火牆
sudo ufw allow 3001

# 4. 檢查 .env 文件
cat frontend/.env.local
# 確保 VITE_SOCKET_URL 指向正確的後端地址
```

### Socket.io 連接失敗

**症狀**：`Socket connected: ...` 消息未出現

**解決**：
```bash
# 1. 檢查後端日誌
npm run dev
# 應該看到「Socket connected」消息

# 2. 檢查瀏覽器開發者工具（F12）
# 查看 Network → WebSocket 標籤

# 3. 確保後端 index.ts 配置正確
# socket.io 初始化應該有 CORS 設置
```

### 遊戲數據不同步

**症狀**：某個玩家看到的狀態與其他人不同

**解決**：
```bash
# 1. 檢查 GameContext.tsx 事件監聽
# 確保所有事件都被正確監聽

# 2. 查看後端日誌
# 檢查事件是否被正確廣播

# 3. 清除瀏覽器緩存
# Ctrl+Shift+Delete 清除所有數據

# 4. 重新連接
# 刷新頁面 Ctrl+R
```

### 房間代碼生成錯誤

**症狀**：無法創建房間，提示錯誤

**解決**：
```bash
# 檢查 RoomService.ts
# 確保房間代碼生成邏輯正確

# 檢查後端日誌中的錯誤信息
# 修復相應的服務方法
```

### 高延遲/卡頓

**症狀**：遊戲操作反應緩慢

**解決**：
```bash
# 1. 檢查網絡延遲
ping your-backend-server.com

# 2. 檢查後端性能
pm2 monit

# 3. 檢查瀏覽器性能
# F12 → Performance → 錄制並分析

# 4. 優化事件頻率
# 減少不必要的狀態更新
```

---

## 📚 有用的命令

```bash
# 後端
cd backend
npm run dev           # 開發
npm run build         # 構建
npm start             # 生產運行
npm run lint          # 代碼檢查

# 前端
cd frontend
npm run dev           # 開發
npm run build         # 構建
npm run preview       # 預覽構建結果
npm run lint          # 代碼檢查

# Git
git status
git add .
git commit -m "your message"
git push origin main
```

---

## 📞 支持

如遇到問題：

1. 檢查 GitHub Issues
2. 查看日誌文件
3. 測試連接（curl 命令）
4. 清除緩存並重新嘗試
5. 查閱本指南的故障排除部分

---

## 📄 許可

MIT License

**祝您遊戲開發順利！🎮**
