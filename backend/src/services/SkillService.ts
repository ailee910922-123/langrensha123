import { PlayerStatus, RoleType, CampType, Player, DeathQueueItem } from '../types/game.types';
import { Logger } from '../utils/logger';

export class SkillService {
  private deathQueue: Map<string, DeathQueueItem[]> = new Map();  // roomId -> deaths
  private wolfKillChoices: Map<string, Map<string, string>> = new Map();  // roomId -> (wolfId -> targetId)
  private seerCheckResults: Map<string, { targetId: string; camp: CampType }> = new Map();  // roomId -> result
  private witchSkillUsed: Map<string, { antidoteUsed: boolean; poisonUsed: boolean }> = new Map();  // roomId -> usage

  /**
   * 狼人選擇目標
   */
  registerWolfKill(roomId: string, wolfId: string, targetId: string): void {
    if (!this.wolfKillChoices.has(roomId)) {
      this.wolfKillChoices.set(roomId, new Map());
    }
    this.wolfKillChoices.get(roomId)!.set(wolfId, targetId);
    Logger.info(`Wolf ${wolfId} selected target ${targetId} in room ${roomId}`);
  }

  /**
   * 獲取狼人的殺害目標（多狼需統一意見）
   */
  getWolfKillTarget(roomId: string, wolfPlayers: Player[]): string | null {
    const choices = this.wolfKillChoices.get(roomId);
    if (!choices) return null;

    const targetVotes = new Map<string, number>();
    let selectedTarget: string | null = null;

    // 統計狼人的投票
    wolfPlayers.forEach(wolf => {
      const target = choices.get(wolf.id);
      if (target) {
        targetVotes.set(target, (targetVotes.get(target) || 0) + 1);
      }
    });

    // 選擇票數最多的目標
    let maxVotes = 0;
    targetVotes.forEach((votes, target) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        selectedTarget = target;
      }
    });

    return selectedTarget;
  }

  /**
   * 預言家查驗玩家
   */
  registerSeerCheck(roomId: string, targetId: string, camp: CampType): void {
    this.seerCheckResults.set(roomId, { targetId, camp });
    Logger.info(`Seer checked player ${targetId} in room ${roomId}, result: ${camp}`);
  }

  /**
   * 獲取預言家查驗結果
   */
  getSeerCheckResult(roomId: string): { targetId: string; camp: CampType } | null {
    return this.seerCheckResults.get(roomId) || null;
  }

  /**
   * 女巫使用技能
   */
  registerWitchSkill(
    roomId: string,
    antidoteTarget?: string,
    poisonTarget?: string
  ): { success: boolean; message: string } {
    const usage = this.witchSkillUsed.get(roomId) || { antidoteUsed: false, poisonUsed: false };

    if (antidoteTarget && usage.antidoteUsed) {
      return { success: false, message: 'Antidote already used in this game' };
    }

    if (poisonTarget && usage.poisonUsed) {
      return { success: false, message: 'Poison already used in this game' };
    }

    if (antidoteTarget) usage.antidoteUsed = true;
    if (poisonTarget) usage.poisonUsed = true;

    this.witchSkillUsed.set(roomId, usage);
    Logger.info(`Witch used skills in room ${roomId}: antidote=${antidoteTarget}, poison=${poisonTarget}`);
    return { success: true, message: 'Skill registered' };
  }

  /**
   * 檢查女巫是否還能使用解藥
   */
  canUseAntidote(roomId: string): boolean {
    const usage = this.witchSkillUsed.get(roomId);
    return !usage || !usage.antidoteUsed;
  }

  /**
   * 檢查女巫是否還能使用毒藥
   */
  canUsePoison(roomId: string): boolean {
    const usage = this.witchSkillUsed.get(roomId);
    return !usage || !usage.poisonUsed;
  }

  /**
   * 將死亡玩家加入死亡佇列
   */
  addToDeathQueue(roomId: string, playerId: string, reason: 'wolf_kill' | 'witch_poison' | 'vote'): void {
    if (!this.deathQueue.has(roomId)) {
      this.deathQueue.set(roomId, []);
    }
    const deathItem: DeathQueueItem = {
      playerId,
      reason,
      timestamp: Date.now(),
    };
    this.deathQueue.get(roomId)!.push(deathItem);
    Logger.info(`Player ${playerId} added to death queue in room ${roomId}, reason: ${reason}`);
  }

  /**
   * 獲取死亡佇列
   */
  getDeathQueue(roomId: string): DeathQueueItem[] {
    return this.deathQueue.get(roomId) || [];
  }

  /**
   * 清空死亡佇列
   */
  clearDeathQueue(roomId: string): void {
    this.deathQueue.delete(roomId);
  }

  /**
   * 處理死亡玩家
   */
  processDeaths(roomId: string, players: Map<string, Player>): { deathCount: number; killedPlayers: Player[] } {
    const deaths = this.getDeathQueue(roomId);
    const killedPlayers: Player[] = [];

    deaths.forEach(death => {
      const player = players.get(death.playerId);
      if (player && player.status === PlayerStatus.ALIVE) {
        player.status = PlayerStatus.DEAD;
        player.lastKilledBy = death.reason;
        killedPlayers.push(player);
      }
    });

    this.clearDeathQueue(roomId);
    return { deathCount: killedPlayers.length, killedPlayers };
  }

  /**
   * 獵人開槍（只有被狼人或投票殺死時才能開槍，被女巫毒死則不能）
   */
  canHunterShoot(player: Player): boolean {
    if (player.role !== RoleType.HUNTER || player.status !== PlayerStatus.DEAD) {
      return false;
    }
    return player.lastKilledBy === 'wolf_kill' || player.lastKilledBy === 'vote';
  }

  /**
   * 清空本回合的技能選擇
   */
  clearRoundSkills(roomId: string): void {
    this.wolfKillChoices.delete(roomId);
    this.seerCheckResults.delete(roomId);
    Logger.info(`Cleared round skills for room ${roomId}`);
  }
}
