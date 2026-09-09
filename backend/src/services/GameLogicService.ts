import { Room, GameState, Player, PlayerStatus, RoleType, CampType } from '../types/game.types';
import { RoomService } from './RoomService';
import { GameStateService } from './GameStateService';
import { RoleAssignmentService } from './RoleAssignmentService';
import { SkillService } from './SkillService';
import { VotingService } from './VotingService';
import { TTSService } from './TTSService';
import { JUDGE_PROMPTS } from '../utils/constants';
import { Logger } from '../utils/logger';

export class GameLogicService {
  constructor(
    private roomService: RoomService,
    private gameStateService: GameStateService,
    private roleAssignmentService: RoleAssignmentService,
    private skillService: SkillService,
    private votingService: VotingService,
    private ttsService: TTSService
  ) {}

  /**
   * 開始遊戲
   */
  async startGame(roomId: string): Promise<{ success: boolean; message: string; assignmentMap?: Map<string, { role: RoleType; camp: CampType }> }> {
    const room = this.roomService.getRoomById(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    const players = this.roomService.getRoomPlayers(roomId);
    if (players.length < 6) {
      return { success: false, message: 'Not enough players' };
    }

    try {
      // 分配角色
      const assignmentMap = this.roleAssignmentService.assignRoles(players);
      
      // 更新玩家角色
      assignmentMap.forEach((assignment, playerId) => {
        this.roomService.assignPlayerRole(roomId, playerId, assignment.role, assignment.camp);
      });

      // 轉移到角色分配狀態
      this.roomService.updateRoomState(roomId, GameState.ROLE_DISTRIBUTION);
      room.gameStartedAt = Date.now();

      Logger.info(`Game started in room ${roomId}`);
      return { success: true, message: 'Game started', assignmentMap };
    } catch (error) {
      Logger.error('Start game error:', error);
      return { success: false, message: 'Failed to start game' };
    }
  }

  /**
   * 進入下一個遊戲狀態
   */
  async transitionToNextState(roomId: string): Promise<{ success: boolean; message: string; newState?: GameState }> {
    const room = this.roomService.getRoomById(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    try {
      const currentState = room.state;
      let nextState = this.gameStateService.transitionToNextState(currentState);

      // 特殊處理：檢查遊戲是否結束
      if (nextState === GameState.NIGHT_WOLF) {
        room.dayNightCount++;
        const gameEnd = this.roleAssignmentService.checkGameEnd(
          Array.from(room.players.values())
        );
        if (gameEnd.isEnd) {
          nextState = GameState.GAME_OVER;
        }
      }

      this.roomService.updateRoomState(roomId, nextState);
      Logger.info(`Room ${roomId} transitioned to ${nextState}`);
      return { success: true, message: `Transitioned to ${nextState}`, newState: nextState };
    } catch (error) {
      Logger.error('Transition error:', error);
      return { success: false, message: 'Failed to transition state' };
    }
  }

  /**
   * 處理狼人殺人（夜晚階段）
   */
  async handleWolfKill(roomId: string, targetId: string, wolfPlayers: Player[]): Promise<{ success: boolean; message: string }> {
    const room = this.roomService.getRoomById(roomId);
    if (!room || room.state !== GameState.NIGHT_WOLF) {
      return { success: false, message: 'Invalid game state' };
    }

    try {
      // 統計所有狼人的選擇，決定最終目標
      const finalTarget = this.skillService.getWolfKillTarget(roomId, wolfPlayers);
      if (finalTarget) {
        this.skillService.addToDeathQueue(roomId, finalTarget, 'wolf_kill');
        Logger.info(`Wolf selected target ${finalTarget} in room ${roomId}`);
        return { success: true, message: 'Wolf kill registered' };
      }
      return { success: false, message: 'Not all wolves have made a choice' };
    } catch (error) {
      Logger.error('Wolf kill error:', error);
      return { success: false, message: 'Failed to process wolf kill' };
    }
  }

  /**
   * 處理預言家查驗
   */
  async handleSeerCheck(roomId: string, targetId: string): Promise<{ success: boolean; message: string }> {
    const room = this.roomService.getRoomById(roomId);
    if (!room || room.state !== GameState.NIGHT_SEER) {
      return { success: false, message: 'Invalid game state' };
    }

    try {
      const targetPlayer = room.players.get(targetId);
      if (!targetPlayer) {
        return { success: false, message: 'Target not found' };
      }

      this.skillService.registerSeerCheck(roomId, targetId, targetPlayer.camp!);
      Logger.info(`Seer checked player ${targetId} in room ${roomId}`);
      return { success: true, message: 'Seer check registered' };
    } catch (error) {
      Logger.error('Seer check error:', error);
      return { success: false, message: 'Failed to process seer check' };
    }
  }

  /**
   * 處理女巫用藥
   */
  async handleWitchSkill(
    roomId: string,
    antidoteTarget?: string,
    poisonTarget?: string
  ): Promise<{ success: boolean; message: string }> {
    const room = this.roomService.getRoomById(roomId);
    if (!room || room.state !== GameState.NIGHT_WITCH) {
      return { success: false, message: 'Invalid game state' };
    }

    try {
      const result = this.skillService.registerWitchSkill(roomId, antidoteTarget, poisonTarget);
      if (!result.success) {
        return result;
      }

      // 如果女巫使用解藥，移除死亡佇列中的該玩家
      if (antidoteTarget) {
        const deaths = this.skillService.getDeathQueue(roomId);
        const index = deaths.findIndex(d => d.playerId === antidoteTarget);
        if (index !== -1) {
          deaths.splice(index, 1);
        }
      }

      // 如果女巫使用毒藥，添加到死亡佇列
      if (poisonTarget) {
        this.skillService.addToDeathQueue(roomId, poisonTarget, 'witch_poison');
      }

      Logger.info(`Witch used skills in room ${roomId}`);
      return { success: true, message: 'Witch skill registered' };
    } catch (error) {
      Logger.error('Witch skill error:', error);
      return { success: false, message: 'Failed to process witch skill' };
    }
  }

  /**
   * 宣布死訊並處理死亡
   */
  async announceDeaths(roomId: string): Promise<{ success: boolean; deadPlayers: Player[] }> {
    const room = this.roomService.getRoomById(roomId);
    if (!room) {
      return { success: false, deadPlayers: [] };
    }

    try {
      const { killedPlayers } = this.skillService.processDeaths(roomId, room.players);
      Logger.info(`${killedPlayers.length} players died in room ${roomId}`);
      return { success: true, deadPlayers: killedPlayers };
    } catch (error) {
      Logger.error('Death announcement error:', error);
      return { success: false, deadPlayers: [] };
    }
  }

  /**
   * 處理投票
   */
  async handleVote(roomId: string, voterId: string, targetId: string): Promise<{ success: boolean; message: string }> {
    const room = this.roomService.getRoomById(roomId);
    if (!room || room.state !== GameState.DAY_VOTE) {
      return { success: false, message: 'Invalid game state' };
    }

    try {
      const result = this.votingService.registerVote(roomId, voterId, targetId);
      return result;
    } catch (error) {
      Logger.error('Vote error:', error);
      return { success: false, message: 'Failed to register vote' };
    }
  }

  /**
   * 結算投票
   */
  async concludeVoting(roomId: string): Promise<{ success: boolean; message: string; eliminated?: Player }> {
    const room = this.roomService.getRoomById(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    try {
      const alivePlayers = this.roomService.getAlivePlayers(roomId);
      const voteResult = this.votingService.calculateVoteResult(roomId, alivePlayers);

      if (!voteResult) {
        return { success: false, message: 'No votes recorded' };
      }

      const eliminatedPlayer = room.players.get(voteResult.eliminated.id);
      if (eliminatedPlayer) {
        this.skillService.addToDeathQueue(roomId, eliminatedPlayer.id, 'vote');
        this.votingService.clearVotes(roomId);
        return { success: true, message: 'Voting concluded', eliminated: eliminatedPlayer };
      }
      return { success: false, message: 'Eliminated player not found' };
    } catch (error) {
      Logger.error('Vote conclusion error:', error);
      return { success: false, message: 'Failed to conclude voting' };
    }
  }

  /**
   * 生成法官台詞並轉語音
   */
  async generateJudgeAnnouncement(
    roomId: string,
    state: GameState,
    deadCount: number = 0
  ): Promise<{ prompt: string; audioUrl?: string; success: boolean }> {
    try {
      const room = this.roomService.getRoomById(roomId);
      if (!room) {
        return { prompt: '', success: false };
      }

      const promptGenerator = JUDGE_PROMPTS[state];
      if (!promptGenerator) {
        return { prompt: '', success: false };
      }

      const prompt = promptGenerator(room.dayNightCount, deadCount);
      
      // 嘗試生成語音（如果 TTS 配置有效）
      try {
        const audioBuffer = await this.ttsService.generateSpeech(prompt);
        const audioFile = await this.ttsService.saveAudioFile(roomId, prompt);
        return {
          prompt,
          audioUrl: audioFile.path,
          success: true,
        };
      } catch (ttsError) {
        Logger.warn('TTS generation failed, returning prompt only:', ttsError);
        return { prompt, success: true };
      }
    } catch (error) {
      Logger.error('Judge announcement error:', error);
      return { prompt: '', success: false };
    }
  }

  /**
   * 檢查遊戲是否結束
   */
  checkGameEnd(roomId: string): { isEnd: boolean; winner?: 'good' | 'evil' } {
    const room = this.roomService.getRoomById(roomId);
    if (!room) {
      return { isEnd: false };
    }

    const players = Array.from(room.players.values());
    return this.roleAssignmentService.checkGameEnd(players);
  }
}
