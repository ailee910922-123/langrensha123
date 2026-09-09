import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService';
import { GameLogicService } from '../services/GameLogicService';
import { GameStateService } from '../services/GameStateService';
import { GameState } from '../types/game.types';
import { Logger } from '../utils/logger';

export function setupGameHandler(
  io: Server,
  socket: Socket,
  roomService: RoomService,
  gameLogicService: GameLogicService,
  gameStateService: GameStateService
) {
  /**
   * 請求進入下一個遊戲狀態
   */
  socket.on('game:next-state', async () => {
    try {
      const room = roomService.getRoomByPlayerId(socket.id);
      if (!room) return;

      const result = await gameLogicService.transitionToNextState(room.id);
      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }

      const newState = result.newState!;
      const players = Array.from(room.players.values());
      const stateDescription = gameStateService.getStateDescription(newState, room.dayNightCount);
      const timeDuration = gameStateService.getStateDuration(newState);

      // 廣播新狀態給所有玩家
      io.to(room.code).emit('game:state-changed', {
        state: newState,
        dayNightCount: room.dayNightCount,
        timeLimit: timeDuration,
        currentPhaseDescription: stateDescription,
        relevantPlayers: players
          .filter(p => gameStateService.shouldPlayerAct(newState, p.role || ''))
          .map(p => p.id),
      });

      // 生成法官播報
      if (newState === GameState.DAY_ANNOUNCE) {
        const announcement = await gameLogicService.generateJudgeAnnouncement(room.id, newState, 0);
        io.to(room.code).emit('game:day-night-announce', {
          type: 'day',
          dayNightCount: room.dayNightCount,
          voicePrompt: announcement.prompt,
          audioUrl: announcement.audioUrl,
          duration: 10,
        });
      } else if (newState === GameState.NIGHT_WOLF) {
        const announcement = await gameLogicService.generateJudgeAnnouncement(room.id, newState, 0);
        io.to(room.code).emit('game:day-night-announce', {
          type: 'night',
          dayNightCount: room.dayNightCount,
          voicePrompt: announcement.prompt,
          audioUrl: announcement.audioUrl,
          duration: 30,
        });
      }

      // 設置狀態計時器
      gameStateService.setStateTimer(room.id, newState, async () => {
        // 時間到時自動進入下一個狀態
        socket.emit('game:state-timeout', { state: newState });
      });

      Logger.info(`Game state changed in room ${room.code} to ${newState}`);
    } catch (error) {
      Logger.error('Game state change error:', error);
      socket.emit('error', { message: 'Failed to change game state' });
    }
  });

  /**
   * 遊戲結束檢查
   */
  socket.on('game:check-end', async () => {
    try {
      const room = roomService.getRoomByPlayerId(socket.id);
      if (!room) return;

      const gameEnd = gameLogicService.checkGameEnd(room.id);
      if (gameEnd.isEnd) {
        const players = Array.from(room.players.values());
        const winners = players.filter(p => p.camp === gameEnd.winner && p.status === 'alive');
        const losers = players.filter(p => p.camp !== gameEnd.winner);

        io.to(room.code).emit('game:over', {
          winner: gameEnd.winner,
          winnerPlayers: winners.map(p => ({
            id: p.id,
            nickname: p.nickname,
            role: p.role,
            camp: p.camp,
          })),
          loserPlayers: losers.map(p => ({
            id: p.id,
            nickname: p.nickname,
            role: p.role,
            camp: p.camp,
          })),
          gameStats: {
            totalDays: Math.ceil(room.dayNightCount / 2),
            totalDeaths: players.filter(p => p.status === 'dead').length,
            duration: room.gameStartedAt ? Date.now() - room.gameStartedAt : 0,
          },
        });

        roomService.updateRoomState(room.id, GameState.GAME_OVER);
      }
    } catch (error) {
      Logger.error('Game end check error:', error);
      socket.emit('error', { message: 'Failed to check game end' });
    }
  });
}
