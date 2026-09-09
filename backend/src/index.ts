import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config/config';
import { Logger } from './utils/logger';

// 服務
import { RoomService } from './services/RoomService';
import { GameStateService } from './services/GameStateService';
import { RoleAssignmentService } from './services/RoleAssignmentService';
import { SkillService } from './services/SkillService';
import { VotingService } from './services/VotingService';
import { ChatService } from './services/ChatService';
import { TTSService } from './services/TTSService';
import { GameLogicService } from './services/GameLogicService';

// 事件處理器
import { setupConnectionHandler } from './handlers/connectionHandler';
import { setupRoomHandler } from './handlers/roomHandler';
import { setupGameHandler } from './handlers/gameHandler';
import { setupSkillHandler } from './handlers/skillHandler';
import { setupVoteHandler } from './handlers/voteHandler';
import { setupChatHandler } from './handlers/chatHandler';

// 初始化應用
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// 中間件
app.use(cors());
app.use(express.json());

// 初始化服務
const roomService = new RoomService();
const gameStateService = new GameStateService();
const roleAssignmentService = new RoleAssignmentService();
const skillService = new SkillService();
const votingService = new VotingService();
const chatService = new ChatService();
const ttsService = new TTSService();
const gameLogicService = new GameLogicService(
  roomService,
  gameStateService,
  roleAssignmentService,
  skillService,
  votingService,
  ttsService
);

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 端點：獲取房間信息
app.get('/api/rooms/:code', (req, res) => {
  try {
    const { code } = req.params;
    const room = roomService.getRoomByCode(code);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      code: room.code,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      state: room.state,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        nickname: p.nickname,
        status: p.status,
        isRoomOwner: p.isRoomOwner,
      })),
    });
  } catch (error) {
    Logger.error('Get room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.IO 連線處理
io.on('connection', (socket) => {
  Logger.info(`Socket connected: ${socket.id}`);

  // 設置所有事件處理器
  setupConnectionHandler(io, socket, roomService);
  setupRoomHandler(io, socket, roomService, gameLogicService);
  setupGameHandler(io, socket, roomService, gameLogicService, gameStateService);
  setupSkillHandler(io, socket, roomService, skillService);
  setupVoteHandler(io, socket, roomService, votingService);
  setupChatHandler(io, socket, roomService, chatService);
});

// 啟動服務器
httpServer.listen(config.port, () => {
  Logger.info(`🎮 Werewolf Game Server running on port ${config.port}`);
  Logger.info(`Environment: ${config.nodeEnv}`);
  Logger.info(`CORS Origin: ${config.corsOrigin}`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

export { httpServer, io, app };
