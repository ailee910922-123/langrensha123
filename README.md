# 狼人殺遊戲

## 📖 完整說明

一個基於 **React + Node.js + Socket.io** 的實時網絡狼人殺遊戲。玩家可以在線與朋友一起玩經典的推理遊戲。

### 🎮 遊戲特色

- ✅ **實時多人遊戲** - 支持6-10名玩家同時在線
- ✅ **五種角色** - 平民、狼人、預言家、女巫、獵人
- ✅ **完整遊戲流程** - 夜間技能使用 → 白天討論 → 投票放逐
- ✅ **即時聊天** - 支持公開和私密陣營聊天
- ✅ **自動計時** - 自動計時每個遊戲階段
- ✅ **響應式設計** - 適配桌面和移動設備

---

## 🚀 快速開始

### 系統要求

- Node.js 18+
- npm 或 yarn
- 現代網頁瀏覽器（Chrome, Firefox, Safari, Edge）

### 安裝

```bash
# 克隆項目
git clone https://github.com/ailee910922-123/langrensha123.git
cd langrensha123

# 後端設置
cd backend
npm install
cp .env.example .env
npm run dev

# 前端設置（新終端）
cd frontend
npm install
echo 'VITE_SOCKET_URL=http://localhost:3001' > .env.local
npm run dev
```

打開 http://localhost:5173 開始遊戲

---

## 📚 遊戲規則

### 遊戲角色

| 角色 | 陣營 | 能力 | 目標 |
|------|------|------|------|
| 平民 👨 | 好人 | 無 | 消滅所有狼人 |
| 狼人 🐺 | 狼人 | 夜間殺害一名平民 | 殺死所有好人 |
| 預言家 🔮 | 好人 | 夜間查驗一名玩家的身份 | 消滅狼人 |
| 女巫 ✨ | 好人 | 夜間解毒或下毒（各用一次） | 消滅狼人 |
| 獵人 🏹 | 好人 | 死亡時可射殺一名玩家 | 消滅狼人 |

### 遊戲流程

#### 🌙 夜間階段（每個晚上按順序）

1. **狼人殺人** (夜間-狼人)
   - 所有狼人私聊討論並選擇要殺害的目標
   - 目標在天亮時宣布死亡

2. **預言家查驗** (夜間-預言家)
   - 預言家選擇一名玩家查驗其身份
   - 立即得到查驗結果（好人或狼人）
   - 預言家和狼人在一起時無法查驗

3. **女巫用藥** (夜間-女巫)
   - 女巫可以選擇救活被殺的玩家（解毒）
   - 或選擇毒死另一名玩家（下毒）
   - 解毒和下毒各只能使用一次

#### ☀️ 白天階段

4. **宣布死訊** (天亮-所有人)
   - 遊戲主持人宣布夜間的死亡情況
   - 死者的身份被揭露

5. **白天討論** (白天-所有人)
   - 所有活著的玩家公開討論和指控
   - 試圖找出狼人
   - 獵人可以發表遺言

6. **投票放逐** (白天-所有人)
   - 所有活著的玩家投票決定放逐誰
   - 票數最多的玩家被放逐
   - 被放逐的玩家退出遊戲

#### 🔄 勝利條件

- **好人勝利** ✅ - 所有狼人被消滅
- **狼人勝利** ❌ - 狼人數量 ≥ 好人數量

---

## 🏗️ 項目結構

```
langrensha123/
├── backend/                    # 後端 Node.js + Socket.io
│   ├── src/
│   │   ├── index.ts           # 主程式入口
│   │   ├── config/            # 配置文件
│   │   ├── handlers/          # Socket 事件處理器
│   │   ├── services/          # 業務邏輯服務
│   │   ├── types/             # TypeScript 類型定義
│   │   └── utils/             # 工具函數
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # 前端 React + TypeScript
│   ├── src/
│   │   ├── main.tsx           # 應用入口
│   │   ├── App.tsx            # 主應用組件
│   │   ├── pages/             # 頁面組件
│   │   ├── components/        # UI 組件
│   │   ├── context/           # React Context 狀態管理
│   │   ├── services/          # API 和業務邏輯
│   │   ├── hooks/             # 自訂 React Hooks
│   │   ├── types/             # TypeScript 類型定義
│   │   └── styles/            # CSS 樣式
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── README.md                   # 本文件
├── SETUP.md                    # 部署指南
└── PROJECT_STRUCTURE.md        # 項目結構說明
```

---

## 🛠️ 技術棧

### 後端
- **Node.js 18+** - 運行時環境
- **Express.js** - Web 框架
- **Socket.io** - 實時通訊
- **TypeScript** - 類型安全

### 前端
- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **Vite** - 構建工具（快速開發）
- **Tailwind CSS** - 樣式框架
- **React Router** - 路由管理
- **Socket.io Client** - 實時通訊客戶端

---

## 📋 功能列表

### ✅ 已實現
- [x] 房間創建和加入
- [x] 玩家管理
- [x] 角色分配
- [x] 遊戲狀態管理
- [x] Socket.io 實時通訊
- [x] 技能系統（狼人殺人、預言家查驗、女巫用藥）
- [x] 投票系統
- [x] 聊天系統（公開和私密）
- [x] 遊戲計時
- [x] 響應式 UI

### ❌ 計劃中
- [ ] 遊戲重放功能
- [ ] 玩家統計和排名
- [ ] 語音聊天集成
- [ ] 多語言支持
- [ ] 遊戲主題自訂
- [ ] 移動應用版本

---

## 🔌 Socket.io 事件

### 房間事件
```javascript
// 客戶端發送
'room:create'      // 創建房間
'room:join'        // 加入房間
'room:leave'       // 離開房間
'room:start'       // 開始遊戲

// 服務器發送
'room:created'     // 房間已創建
'room:joined'      // 已加入房間
'room:updated'     // 房間信息已更新
'notification'     // 系統通知
```

### 遊戲事件
```javascript
'game:started'         // 遊戲已開始
'game:role-assigned'   // 角色已分配
'game:state-changed'   // 遊戲狀態改變
'game:over'            // 遊戲結束
```

### 技能事件
```javascript
'skill:wolf-select'    // 狼人選擇目標
'skill:seer-check'     // 預言家查驗
'skill:witch-use'      // 女巫用藥
'skill:hunter-shoot'   // 獵人開槍
```

### 投票事件
```javascript
'vote:cast'            // 投票
'vote:cancel'          // 取消投票
'vote:conclude'        // 結束投票
'vote:results'         // 投票結果
```

### 聊天事件
```javascript
'chat:send'            // 發送消息
'chat:received'        // 接收消息
'chat:get-history'     // 獲取聊天記錄
'chat:history'         // 聊天記錄數據
```

---

## 🖥️ API 端點

### 健康檢查
```http
GET /health

 Response: { status: "ok", timestamp: "2024-01-01T12:00:00Z" }
```

### 獲取房間信息
```http
GET /api/rooms/:code

Response: {
  code: "ABC123",
  playerCount: 6,
  maxPlayers: 10,
  state: "GAME_RUNNING",
  players: [...],
  ...
}
```

---

## 🎨 UI 截圖

### 首頁
- 創建房間表單
- 加入房間表單
- 遊戲說明

### 大廳
- 房間代碼顯示
- 玩家列表
- 開始遊戲按鈕（房主）

### 遊戲頁面
- 玩家卡片網格
- 遊戲狀態和計時
- 技能操作區
- 聊天框
- 玩家身份顯示

---

## 💾 數據存儲

目前所有數據存儲在內存中。生產環境建議添加：

- **Redis** - 房間和玩家狀態
- **MongoDB** - 遊戲記錄和統計
- **PostgreSQL** - 玩家賬戶（如需要）

---

## 🔐 安全性

### 已實現
- ✅ TypeScript 類型檢查
- ✅ 輸入驗證
- ✅ Socket.io 事件驗證
- ✅ CORS 保護

### 建議改進
- 🔒 添加身份驗證（JWT）
- 🔒 實現速率限制
- 🔒 添加數據加密
- 🔒 實現 WebSocket 安全握手

---

## 🧪 測試

### 本地測試

```bash
# 1. 啟動後端和前端
# (如上面的快速開始)

# 2. 打開多個瀏覽器窗口
# - 窗口1：創建房間
# - 窗口2-6：加入房間
# - 房主點擊「開始遊戲」

# 3. 測試遊戲流程
# - 夜間觀察技能操作
# - 白天進行投票
# - 驗證遊戲結束條件
```

### 調試技巧

```javascript
// 在瀏覽器控制台查看 Socket 事件
const socket = window.socket;
socket.on('*', (event, ...args) => {
  console.log('事件:', event, args);
});
```

---

## 📱 移動端支持

- ✅ 響應式設計
- ✅ 觸摸友好的按鈕
- ⚠️ 聊天框需要優化
- ⚠️ 建議使用橫屏模式

---

## 🐛 已知問題

1. 某些古老瀏覽器可能不支持 WebSocket
2. 移動端聊天框可能被鍵盤遮擋
3. 快速連接/斷開可能導致狀態不同步

---

## 🤝 貢獻

歡迎提交 Pull Request 或報告 Issue！

---

## 📄 許可

MIT License - 詳見 LICENSE 文件

---

## 📞 聯繫

- GitHub Issues - 報告 bug
- 討論 - 功能建議

---

## 🙏 致謝

感謝所有貢獻者和使用者的支持！

---

**祝您遊戲愉快！🎮🐺**
