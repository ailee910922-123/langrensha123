# Werewolf Game Project Structure

```
werewolf-game/
├── backend/
│   ├── src/
│   │   ├── index.ts                          # 主程式入口
│   │   ├── types/
│   │   │   ├── game.types.ts                 # 遊戲類型定義
│   │   │   ├── socket.types.ts               # Socket 事件類型
│   │   │   └── room.types.ts                 # 房間相關類型
│   │   ├── services/
│   │   │   ├── RoomService.ts                # 房間管理服務
│   │   │   ├── GameStateService.ts           # 遊戲狀態管理
│   │   │   ├── GameLogicService.ts           # 遊戲核心邏輯
│   │   │   ├── RoleAssignmentService.ts      # 角色分配演算法
│   │   │   ├── VotingService.ts              # 投票邏輯
│   │   │   ├── SkillService.ts               # 技能處理
│   │   │   ├── TTSService.ts                 # 文字轉語音服務
│   │   │   └── ChatService.ts                # 內部對話框管理
│   │   ├── handlers/
│   │   │   ├── connectionHandler.ts          # 連線事件
│   │   │   ├── roomHandler.ts                # 房間事件
│   │   │   ├── gameHandler.ts                # 遊戲事件
│   │   │   ├── skillHandler.ts               # 技能事件
│   │   │   ├── chatHandler.ts                # 聊天事件
│   │   │   └── voteHandler.ts                # 投票事件
│   │   ├── utils/
│   │   │   ├── constants.ts                  # 常數定義
│   │   │   ├── validators.ts                 # 驗證工具
│   │   │   └── logger.ts                     # 日誌工具
│   │   └── config/
│   │       └── config.ts                     # 環境配置
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── index.tsx                         # 主程式入口
│   │   ├── pages/
│   │   │   ├── Home.tsx                      # 首頁
│   │   │   ├── JoinRoom.tsx                  # 加入房間
│   │   │   ├── GameBoard.tsx                 # 遊戲主畫面
│   │   │   └── GameOver.tsx                  # 遊戲結束
│   │   ├── components/
│   │   │   ├── RoomSetup/
│   │   │   │   ├── CreateRoom.tsx
│   │   │   │   ├── JoinRoomForm.tsx
│   │   │   │   └── RoomLobby.tsx
│   │   │   ├── GameBoard/
│   │   │   │   ├── StatusBar.tsx             # 狀態列
│   │   │   │   ├── PlayerGrid.tsx            # 玩家網格
│   │   │   │   ├── ActionPanel.tsx           # 操作區域
│   │   │   │   ├── SkillAction.tsx           # 技能操作
│   │   │   │   ├── VotingPanel.tsx           # 投票面板
│   │   │   │   └── ChatBox.tsx               # 對話框
│   │   │   ├── Modal/
│   │   │   │   ├── SkillModal.tsx
│   │   │   │   ├── VoteConfirmModal.tsx
│   │   │   │   └── GameOverModal.tsx
│   │   │   └── Common/
│   │   │       ├── Avatar.tsx
│   │   │       ├── Timer.tsx
│   │   │       └── Loading.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts                  # Socket 連線
│   │   │   ├── useGameState.ts               # 遊戲狀態管理
│   │   │   ├── useRoom.ts                    # 房間操作
│   │   │   └── useAudio.ts                   # 音頻播放
│   │   ├── context/
│   │   │   ├── GameContext.tsx               # 遊戲全域狀態
│   │   │   └── SocketContext.tsx             # Socket 全域狀態
│   │   ├── services/
│   │   │   ├── socketService.ts              # Socket 服務
│   │   │   └── ttsService.ts                 # 語音合成服務
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── tailwind.config.js
│   │   └── utils/
│   │       ├── constants.ts
│   │       └── helpers.ts
│   ├── public/
│   │   └── assets/
│   │       ├── audio/
│   │       └── images/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```
