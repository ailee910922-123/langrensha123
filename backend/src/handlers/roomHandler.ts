import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService';
import { GameLogicService } from '../services/GameLogicService';
import { Logger } from '../utils/logger';

export function setupRoomHandler(
  io: Server,
  socket: Socket,
  roomService: RoomService,
  gameLogicService: GameLogicService
) {
  /**
   * 創建房間
   */
  socket.on('room:create', (data) => {
    try {
      const { nickname, maxPlayers = 6 } = data;
      const room = roomService.createRoom(socket.id, nickname, maxPlayers);
      
      // 加入 Socket 房間
      socket.join(room.code);
      
      socket.emit('room:created', {
        code: room.code,
        roomId: room.id,
        isOwner: true,
      });
      
      Logger.info(`Room created: ${room.code}`);
    } catch (error) {
      Logger.error('Create room error:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  /**
   * 加入房間
   */
  socket.on('room:join', (data) => {
    try {
      const { code, nickname } = data;
      const result = roomService.addPlayerToRoom(code, socket.id, nickname);
      
      if (!result.success) {
        socket.emit('room:join-failed', { message: result.message });
        return;
      }

      // 加入 Socket 房間
      socket.join(code);
      
      socket.emit('room:joined', {
        code: result.room.code,
        roomId: result.room.id,
        isOwner: false,
      });
      
      // 廣播房間更新給所有玩家
      const players = Array.from(result.room.players.values());
      io.to(code).emit('room:updated', {
        code: result.room.code,
        playerCount: result.room.players.size,
        players: players.map(p => ({
          id: p.id,
          nickname: p.nickname,
          status: p.status,
          isRoomOwner: p.isRoomOwner,
        })),
        state: result.room.state,
        ownerSocketId: result.room.ownerSocketId,
        maxPlayers: result.room.maxPlayers,
      });
      
      io.to(code).emit('notification', {
        message: `${nickname} 加入了房間`,
        type: 'info',
      });
      
      Logger.info(`Player ${nickname} joined room ${code}`);
    } catch (error) {
      Logger.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  /**
   * 離開房間
   */
  socket.on('room:leave', () => {
    try {
      const room = roomService.getRoomByPlayerId(socket.id);
      if (!room) return;

      const { success } = roomService.removePlayerFromRoom(socket.id);
      if (success) {
        socket.leave(room.code);
        
        if (room.players.size > 0) {
          io.to(room.code).emit('room:updated', {
            code: room.code,
            playerCount: room.players.size,
            players: Array.from(room.players.values()).map(p => ({
              id: p.id,
              nickname: p.nickname,
              status: p.status,
              isRoomOwner: p.isRoomOwner,
            })),
            state: room.state,
            ownerSocketId: room.ownerSocketId,
            maxPlayers: room.maxPlayers,
          });
          io.to(room.code).emit('notification', {
            message: '有玩家離開了房間',
            type: 'info',
          });
        }
        
        Logger.info(`Player ${socket.id} left room ${room.code}`);
      }
    } catch (error) {
      Logger.error('Leave room error:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });

  /**
   * 開始遊戲
   */
  socket.on('room:start', async () => {
    try {
      const room = roomService.getRoomByPlayerId(socket.id);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // 驗證是否為房主
      if (room.ownerSocketId !== socket.id) {
        socket.emit('error', { message: 'Only room owner can start the game' });
        return;
      }

      // 驗證玩家數量
      if (room.players.size < 6) {
        socket.emit('error', { message: 'At least 6 players are required' });
        return;
      }

      // 開始遊戲
      const result = await gameLogicService.startGame(room.id);
      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }

      // 廣播遊戲開始給所有玩家
      io.to(room.code).emit('game:started', {
        roomId: room.id,
        playerCount: room.players.size,
      });

      // 發送角色分配給每個玩家
      result.assignmentMap?.forEach((assignment, playerId) => {
        const playerSocket = io.sockets.sockets.get(playerId);
        if (playerSocket) {
          playerSocket.emit('game:role-assigned', {
            yourRole: assignment.role,
            yourCamp: assignment.camp,
            allPlayers: Array.from(room.players.values()).map(p => ({
              id: p.id,
              nickname: p.nickname,
              status: p.status,
            })),
          });
        }
      });

      Logger.info(`Game started in room ${room.code}`);
    } catch (error) {
      Logger.error('Start game error:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });
}
