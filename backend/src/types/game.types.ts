// 遊戲角色類型
export enum RoleType {
  VILLAGER = 'villager',      // 平民
  WEREWOLF = 'werewolf',      // 狼人
  SEER = 'seer',              // 預言家
  WITCH = 'witch',            // 女巫
  HUNTER = 'hunter'           // 獵人
}

// 陣營類型
export enum CampType {
  GOOD = 'good',        // 好人陣營（平民、神職）
  EVIL = 'evil'          // 狼人陣營
}

// 遊戲狀態
export enum GameState {
  LOBBY = 'LOBBY',                          // 等待中
  ROLE_DISTRIBUTION = 'ROLE_DISTRIBUTION',  // 發放身分
  NIGHT_WOLF = 'NIGHT_WOLF',                // 狼人殺人
  NIGHT_SEER = 'NIGHT_SEER',                // 預言家查驗
  NIGHT_WITCH = 'NIGHT_WITCH',              // 女巫用藥
  DAY_ANNOUNCE = 'DAY_ANNOUNCE',            // 公布死訊
  DAY_DISCUSS = 'DAY_DISCUSS',              // 白天發言
  DAY_VOTE = 'DAY_VOTE',                    // 投票放逐
  GAME_OVER = 'GAME_OVER'                   // 結算勝負
}

// 玩家狀態
export enum PlayerStatus {
  ALIVE = 'alive',
  DEAD = 'dead',
  ELIMINATED = 'eliminated'
}

// 玩家資料
export interface Player {
  id: string;                      // 玩家 ID（socket ID）
  nickname: string;                // 暱稱
  role: RoleType | null;           // 角色
  camp: CampType | null;           // 陣營
  status: PlayerStatus;            // 狀態
  isRoomOwner: boolean;            // 是否為房主
  skillUsed: {
    seerCheck: boolean;            // 預言家是否已查驗
    witchAntidote: boolean;        // 女巫是否已用解藥
    witchPoison: boolean;          // 女巫是否已用毒藥
  };
  lastKilledBy?: string;           // 最後被狼人選中的玩家 ID
}

// 房間資料
export interface Room {
  id: string;                      // 房間 ID
  code: string;                    // 房間號碼（4-6 碼）
  players: Map<string, Player>;    // 玩家映射
  ownerSocketId: string;           // 房主 Socket ID
  state: GameState;                // 遊戲狀態
  dayNightCount: number;           // 第幾天/夜
  createdAt: number;               // 創建時間
  gameStartedAt?: number;          // 遊戲開始時間
  maxPlayers: number;              // 最大玩家數
}

// 死亡佇列項目
export interface DeathQueueItem {
  playerId: string;
  reason: 'wolf_kill' | 'witch_poison' | 'vote';
  timestamp: number;
}

// 投票紀錄
export interface VoteRecord {
  voterId: string;
  targetId: string;
  timestamp: number;
}

// 狼人殺人選擇
export interface WolfKillChoice {
  targetId: string;
  timestamp: number;
}

// 預言家查驗結果
export interface SeerCheckResult {
  targetId: string;
  camp: CampType;
  timestamp: number;
}

// 女巫用藥選擇
export interface WitchSkillChoice {
  targetId?: string;    // 解藥目標（可選）
  poisonTargetId?: string; // 毒藥目標（可選）
  timestamp: number;
}

// 獵人開槍選擇
export interface HunterShootChoice {
  targetId: string;
  timestamp: number;
}
