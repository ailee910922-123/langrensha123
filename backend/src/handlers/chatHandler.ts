import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService';
import { ChatService } from '../services/ChatService';
import { Logger } from '../utils/logger';

export function setupChatHandler(
  io: Server,
  socket: Socket,
  roomService: RoomService,
  chatService: ChatService
) {
  /**
   * 發送聊天訊息
   */
  socket.on('chat:send', (data) => {
    try {
      const { message, roomCode, isPrivate, targetCamp } = data;
      const room = roomService.getRoomByCode(roomCode);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const player = room.players.get(socket.id);
      if (!player) {
        socket.emit('error', { message: 'Player not found in room' });
        return;
      }

      if (isPrivate) {
        // 發送陣營私聊
        if (!targetCamp || !player.camp || player.camp !== targetCamp) {
          socket.emit('error', { message: 'Invalid camp for private chat' });
          return;
        }

        const chatMessage = chatService.sendCampMessage(
          room.id,
          targetCamp,
          socket.id,
          player.nickname,
          message
        );

        // 只有同陣營的存活玩家能看到
        const campPlayers = Array.from(room.players.values()).filter(
          p => p.camp === targetCamp && p.status === 'alive'
        );

        campPlayers.forEach(p => {
          const playerSocket = io.sockets.sockets.get(p.id);
          if (playerSocket) {
            playerSocket.emit('chat:received', {
              from: chatMessage.from,
              fromNickname: chatMessage.fromNickname,
              message: chatMessage.message,
              timestamp: chatMessage.timestamp,
              isPrivate: true,
              targetCamp: targetCamp,
            });
          }
        });

        Logger.info(`Camp message in room ${room.code}: ${targetCamp} - ${player.nickname}`);
      } else {
        // 發送公開聊天
        const chatMessage = chatService.sendPublicMessage(
          room.id,
          socket.id,
          player.nickname,
          message
        );

        io.to(room.code).emit('chat:received', {
          from: chatMessage.from,
          fromNickname: chatMessage.fromNickname,
          message: chatMessage.message,
          timestamp: chatMessage.timestamp,
          isPrivate: false,
        });

        Logger.info(`Public message in room ${room.code}: ${player.nickname}`);
      }
    } catch (error) {
      Logger.error('Chat error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * 獲取聊天歷史
   */
  socket.on('chat:get-history', (data) => {
    try {
      const { roomCode, isPrivate, targetCamp } = data;
      const room = roomService.getRoomByCode(roomCode);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      let messages: any[] = [];

      if (isPrivate && targetCamp) {
        messages = chatService.getCampMessages(room.id, targetCamp);
      } else {
        messages = chatService.getPublicMessages(room.id);
      }

      socket.emit('chat:history', {
        messages: messages.map(m => ({
          from: m.from,
          fromNickname: m.fromNickname,
          message: m.message,
          timestamp: m.timestamp,
          isPrivate: m.isPrivate,
          targetCamp: m.targetCamp,
        })),
      });

      Logger.info(`Chat history retrieved for room ${room.code}`);
    } catch (error) {
      Logger.error('Get chat history error:', error);
      socket.emit('error', { message: 'Failed to get chat history' });
    }
  });
}
