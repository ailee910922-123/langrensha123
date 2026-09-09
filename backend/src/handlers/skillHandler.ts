import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService';
import { SkillService } from '../services/SkillService';
import { GameState } from '../types/game.types';
import { Logger } from '../utils/logger';

export function setupSkillHandler(
  io: Server,
  socket: Socket,
  roomService: RoomService,
  skillService: SkillService
) {
  /**
   * 狼人選擇殺害目標
   */
  socket.on('skill:wolf-select', (data) => {
    try {
      const { targetId } = data;
      const room = roomService.getRoomByPlayerId(socket.id);
      
      if (!room || room.state !== GameState.NIGHT_WOLF) {
        socket.emit('error', { message: 'Invalid game state for wolf selection' });
        return;
      }

      const player = room.players.get(socket.id);
      if (!player || player.role !== 'werewolf') {
        socket.emit('error', { message: 'Only werewolves can select targets' });
        return;
      }

      skillService.registerWolfKill(room.id, socket.id, targetId);
      socket.emit('notification', { message: '你已選擇目標', type: 'info' });
      Logger.info(`Wolf ${socket.id} selected target ${targetId}`);
    } catch (error) {
      Logger.error('Wolf selection error:', error);
      socket.emit('error', { message: 'Failed to select wolf target' });
    }
  });

  /**
   * 預言家查驗玩家
   */
  socket.on('skill:seer-check', (data) => {
    try {
      const { targetId } = data;
      const room = roomService.getRoomByPlayerId(socket.id);
      
      if (!room || room.state !== GameState.NIGHT_SEER) {
        socket.emit('error', { message: 'Invalid game state for seer check' });
        return;
      }

      const player = room.players.get(socket.id);
      if (!player || player.role !== 'seer') {
        socket.emit('error', { message: 'Only seers can check players' });
        return;
      }

      const targetPlayer = room.players.get(targetId);
      if (!targetPlayer) {
        socket.emit('error', { message: 'Target not found' });
        return;
      }

      skillService.registerSeerCheck(room.id, targetId, targetPlayer.camp!);
      socket.emit('skill:seer-result', {
        targetId,
        targetNickname: targetPlayer.nickname,
        camp: targetPlayer.camp,
      });
      Logger.info(`Seer ${socket.id} checked ${targetId}`);
    } catch (error) {
      Logger.error('Seer check error:', error);
      socket.emit('error', { message: 'Failed to check player' });
    }
  });

  /**
   * 女巫使用技能
   */
  socket.on('skill:witch-use', (data) => {
    try {
      const { antidoteTarget, poisonTarget } = data;
      const room = roomService.getRoomByPlayerId(socket.id);
      
      if (!room || room.state !== GameState.NIGHT_WITCH) {
        socket.emit('error', { message: 'Invalid game state for witch skill' });
        return;
      }

      const player = room.players.get(socket.id);
      if (!player || player.role !== 'witch') {
        socket.emit('error', { message: 'Only witches can use skills' });
        return;
      }

      // 驗證解藥使用
      if (antidoteTarget && !skillService.canUseAntidote(room.id)) {
        socket.emit('error', { message: 'Antidote already used in this game' });
        return;
      }

      // 驗證毒藥使用
      if (poisonTarget && !skillService.canUsePoison(room.id)) {
        socket.emit('error', { message: 'Poison already used in this game' });
        return;
      }

      const result = skillService.registerWitchSkill(room.id, antidoteTarget, poisonTarget);
      if (result.success) {
        socket.emit('notification', { message: '女巫技能已使用', type: 'info' });
      } else {
        socket.emit('error', { message: result.message });
      }

      Logger.info(`Witch ${socket.id} used skills: antidote=${antidoteTarget}, poison=${poisonTarget}`);
    } catch (error) {
      Logger.error('Witch skill error:', error);
      socket.emit('error', { message: 'Failed to use witch skill' });
    }
  });

  /**
   * 獵人開槍
   */
  socket.on('skill:hunter-shoot', (data) => {
    try {
      const { targetId } = data;
      const room = roomService.getRoomByPlayerId(socket.id);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const player = room.players.get(socket.id);
      if (!player || player.role !== 'hunter') {
        socket.emit('error', { message: 'Only hunters can shoot' });
        return;
      }

      if (!skillService.canHunterShoot(player)) {
        socket.emit('error', { message: 'You cannot shoot at this time' });
        return;
      }

      const targetPlayer = room.players.get(targetId);
      if (!targetPlayer || targetPlayer.status !== 'alive') {
        socket.emit('error', { message: 'Target is not alive' });
        return;
      }

      // 獵人開槍
      skillService.addToDeathQueue(room.id, targetId, 'wolf_kill');  // 記錄為獵人射殺
      io.to(room.code).emit('notification', {
        message: `獵人 ${player.nickname} 射殺了 ${targetPlayer.nickname}`,
        type: 'warning',
      });

      Logger.info(`Hunter ${socket.id} shot ${targetId}`);
    } catch (error) {
      Logger.error('Hunter shoot error:', error);
      socket.emit('error', { message: 'Failed to shoot' });
    }
  });
}
