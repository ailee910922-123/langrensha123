import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService';
import { VotingService } from '../services/VotingService';
import { GameState } from '../types/game.types';
import { Logger } from '../utils/logger';

export function setupVoteHandler(
  io: Server,
  socket: Socket,
  roomService: RoomService,
  votingService: VotingService
) {
  /**
   * 投票
   */
  socket.on('vote:cast', (data) => {
    try {
      const { targetId } = data;
      const room = roomService.getRoomByPlayerId(socket.id);
      
      if (!room || room.state !== GameState.DAY_VOTE) {
        socket.emit('error', { message: 'Invalid game state for voting' });
        return;
      }

      const player = room.players.get(socket.id);
      if (!player || player.status !== 'alive') {
        socket.emit('error', { message: 'Only alive players can vote' });
        return;
      }

      const targetPlayer = room.players.get(targetId);
      if (!targetPlayer || targetPlayer.status !== 'alive') {
        socket.emit('error', { message: 'Target must be alive' });
        return;
      }

      const result = votingService.registerVote(room.id, socket.id, targetId);
      if (result.success) {
        const alivePlayers = roomService.getAlivePlayers(room.id);
        const progress = votingService.getVoteProgress(room.id, alivePlayers.length);
        
        io.to(room.code).emit('vote:progress', {
          progress,
          votedCount: Math.floor((alivePlayers.length * progress) / 100),
          totalCount: alivePlayers.length,
        });

        socket.emit('notification', { message: '投票已記錄', type: 'info' });
        Logger.info(`Player ${socket.id} voted for ${targetId}`);
      } else {
        socket.emit('error', { message: result.message });
      }
    } catch (error) {
      Logger.error('Vote error:', error);
      socket.emit('error', { message: 'Failed to cast vote' });
    }
  });

  /**
   * 取消投票
   */
  socket.on('vote:cancel', (data) => {
    try {
      const room = roomService.getRoomByPlayerId(socket.id);
      if (!room) return;

      votingService.cancelVote(room.id, socket.id);
      socket.emit('notification', { message: '投票已取消', type: 'info' });
      Logger.info(`Player ${socket.id} cancelled their vote`);
    } catch (error) {
      Logger.error('Vote cancellation error:', error);
      socket.emit('error', { message: 'Failed to cancel vote' });
    }
  });

  /**
   * 請求投票結果
   */
  socket.on('vote:conclude', async () => {
    try {
      const room = roomService.getRoomByPlayerId(socket.id);
      if (!room) return;

      const alivePlayers = roomService.getAlivePlayers(room.id);
      const voteResult = votingService.calculateVoteResult(room.id, alivePlayers);

      if (!voteResult) {
        socket.emit('error', { message: 'No votes recorded' });
        return;
      }

      io.to(room.code).emit('vote:results', {
        eliminated: voteResult.eliminated,
        allVotes: voteResult.allVotes,
        isTie: voteResult.isTie,
      });

      votingService.clearVotes(room.id);
      Logger.info(`Voting concluded in room ${room.code}`);
    } catch (error) {
      Logger.error('Vote conclusion error:', error);
      socket.emit('error', { message: 'Failed to conclude voting' });
    }
  });
}
