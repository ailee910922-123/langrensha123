import { Player, PlayerStatus } from '../types/game.types';
import { Logger } from '../utils/logger';

export interface VoteResult {
  eliminated: {
    id: string;
    nickname: string;
    voteCount: number;
  };
  allVotes: Array<{
    targetId: string;
    nickname: string;
    voteCount: number;
  }>;
  isTie: boolean;
}

export class VotingService {
  private voteRecords: Map<string, Map<string, string>> = new Map();  // roomId -> (voterId -> targetId)
  private tieBreakerRound: Map<string, boolean> = new Map();  // roomId -> isTieBreaker

  /**
   * 記錄投票
   */
  registerVote(roomId: string, voterId: string, targetId: string): { success: boolean; message: string } {
    if (!this.voteRecords.has(roomId)) {
      this.voteRecords.set(roomId, new Map());
    }

    const votes = this.voteRecords.get(roomId)!;
    votes.set(voterId, targetId);
    Logger.info(`Vote registered in room ${roomId}: ${voterId} -> ${targetId}`);
    return { success: true, message: 'Vote registered' };
  }

  /**
   * 取消投票
   */
  cancelVote(roomId: string, voterId: string): void {
    const votes = this.voteRecords.get(roomId);
    if (votes) {
      votes.delete(voterId);
      Logger.info(`Vote cancelled in room ${roomId} by ${voterId}`);
    }
  }

  /**
   * 結算投票結果
   */
  calculateVoteResult(roomId: string, alivePlayers: Player[]): VoteResult | null {
    const votes = this.voteRecords.get(roomId);
    if (!votes || votes.size === 0) {
      return null;
    }

    // 統計每個目標的票數
    const voteCount = new Map<string, number>();
    const targetNames = new Map<string, string>();

    votes.forEach((targetId, voterId) => {
      voteCount.set(targetId, (voteCount.get(targetId) || 0) + 1);
      const targetPlayer = alivePlayers.find(p => p.id === targetId);
      if (targetPlayer) {
        targetNames.set(targetId, targetPlayer.nickname);
      }
    });

    // 找出票數最多的目標
    let maxVotes = 0;
    let eliminatedTarget: string | null = null;
    const tieCandidates: string[] = [];

    voteCount.forEach((count, targetId) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedTarget = targetId;
        tieCandidates.length = 0;
        tieCandidates.push(targetId);
      } else if (count === maxVotes) {
        tieCandidates.push(targetId);
      }
    });

    const isTie = tieCandidates.length > 1;

    // 構建結果
    const allVotes = Array.from(voteCount.entries()).map(([targetId, count]) => ({
      targetId,
      nickname: targetNames.get(targetId) || 'Unknown',
      voteCount: count,
    }));

    return {
      eliminated: {
        id: eliminatedTarget!,
        nickname: targetNames.get(eliminatedTarget!) || 'Unknown',
        voteCount: maxVotes,
      },
      allVotes,
      isTie,
    };
  }

  /**
   * 清空投票紀錄
   */
  clearVotes(roomId: string): void {
    this.voteRecords.delete(roomId);
    Logger.info(`Votes cleared for room ${roomId}`);
  }

  /**
   * 獲取投票進度
   */
  getVoteProgress(roomId: string, totalAlivePlayers: number): number {
    const votes = this.voteRecords.get(roomId);
    if (!votes) return 0;
    return Math.round((votes.size / totalAlivePlayers) * 100);
  }
}
