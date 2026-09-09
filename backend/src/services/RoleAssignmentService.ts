import { RoleType, CampType, Player } from '../types/game.types';
import { ROLE_CONFIG } from '../utils/constants';
import { Logger } from '../utils/logger';

export class RoleAssignmentService {
  /**
   * 根據玩家數量自動分配角色
   */
  assignRoles(players: Player[]): Map<string, { role: RoleType; camp: CampType }> {
    const playerCount = players.length;
    
    if (!ROLE_CONFIG[playerCount]) {
      throw new Error(`Unsupported player count: ${playerCount}`);
    }

    const roleConfig = ROLE_CONFIG[playerCount];
    const rolePool: RoleType[] = [];

    // 根據配置生成角色池
    Object.entries(roleConfig).forEach(([role, count]) => {
      for (let i = 0; i < count; i++) {
        rolePool.push(role as RoleType);
      }
    });

    // 打亂角色池
    for (let i = rolePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
    }

    // 分配角色
    const assignment = new Map<string, { role: RoleType; camp: CampType }>();
    
    players.forEach((player, index) => {
      const role = rolePool[index];
      const camp = this.getRoleCamp(role);
      assignment.set(player.id, { role, camp });
      Logger.info(`Assigned ${player.nickname} as ${role} (${camp})`);
    });

    return assignment;
  }

  /**
   * 根據角色獲取陣營
   */
  private getRoleCamp(role: RoleType): CampType {
    if (role === RoleType.WEREWOLF) {
      return CampType.EVIL;
    }
    return CampType.GOOD;
  }

  /**
   * 判斷遊戲是否結束
   */
  checkGameEnd(players: Player[]): { isEnd: boolean; winner?: 'good' | 'evil' } {
    const wolfCount = players.filter(p => p.role === RoleType.WEREWOLF && p.status === 'alive').length;
    const goodCount = players.filter(p => p.camp === CampType.GOOD && p.status === 'alive').length;

    // 狼人全死 → 好人陣營贏
    if (wolfCount === 0) {
      return { isEnd: true, winner: 'good' };
    }

    // 好人全死或神職全死 → 狼人陣營贏
    if (goodCount === 0) {
      return { isEnd: true, winner: 'evil' };
    }

    return { isEnd: false };
  }
}
