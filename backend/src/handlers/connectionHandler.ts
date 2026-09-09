import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService';
import { Logger } from '../utils/logger';

export function setupConnectionHandler(
  io: Server,
  socket: Socket,
  roomService: RoomService
) {
  /**
   * 玩家連線
   */
  socket.on('connect', () => {
    Logger.info(`Player connected: ${socket.id}`);
    socket.emit('connection:success', { socketId: socket.id });
  });

  /**
   * 玩家斷線
   */
  socket.on('disconnect', () => {
    Logger.info(`Player disconnected: ${socket.id}`);
    
    // 從房間中移除玩家
    const { room, success } = roomService.removePlayerFromRoom(socket.id);
    
    if (success && room) {
      if (room.players.size > 0) {
        // 廣播房間更新
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
          message: '有玩家斷線了',
          type: 'warning',
        });
      }
    }
  });

  /**
   * 連線錯誤處理
   */
  socket.on('error', (error) => {
    Logger.error('Socket error:', error);
    socket.emit('error', { message: 'Connection error', code: error.code });
  });
}
