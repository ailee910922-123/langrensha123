/**
 * TypeScript 類型定義文件
 * 用途：定義整個前端應用使用的數據結構和類型
 * 這些類型來自後端定義，保持前後端一致
 */

// ==================== 遊戲角色 ====================
export enum RoleType {
  VILLAGER = 'villager',      // 平民
  WEREWOLF = 'werewolf',      // 狼人
  SEER = 'seer',              // 預言家
  WITCH = 'witch',            // 女巫
  HUNTER = 'hunter'           // 獵人
}

// ==================== 阵營 ====================
export enum CampType {
  GOOD = 'good',    // 好人陣營（平民、神職）
  EVIL = 'evil'      // 狼人陣營
}

// ==================== 遊戲狀態 ====================
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

// ==================== 玩家狀態 ====================
export enum PlayerStatus {
  ALIVE = 'alive',
  DEAD = 'dead',
  ELIMINATED = 'eliminated'
}

// ==================== 玩家數據 ====================
export interface Player {
  id: string;                      // 玩家 ID（socket ID）
  nickname: string;                // 暱稱
  role?: RoleType;                 // 角色（遊戲開始後分配）
  camp?: CampType;                 // 陣營
  status: PlayerStatus;            // 狀態
  isRoomOwner: boolean;            // 是否為房主
}

// ==================== 房間數據 ====================
export interface Room {
  code: string;                    // 房間代碼
  roomId: string;                  // 房間ID
  playerCount: number;             // 目前玩家數
  maxPlayers: number;              // 最大玩家數
  state: GameState;                // 房間狀態
  players: Player[];               // 玩家列表
  ownerSocketId: string;           // 房主Socket ID
}

// ==================== 聊天訊息 ====================
export interface ChatMessage {
  from: string;                   // 發送者ID
  fromNickname: string;           // 發送者暱稱
  message: string;                // 訊息內容
  timestamp: number;              // 發送時間戳
  isPrivate: boolean;             // 是否私聊
  targetCamp?: string;            // 如果是陣營私聊
}

// ==================== 投票結果 ====================
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

// ==================== 遊戲結束 ====================
export interface GameOverData {
  winner: 'good' | 'evil';
  winnerPlayers: Player[];
  loserPlayers: Player[];
  gameStats: {
    totalDays: number;
    totalDeaths: number;
    duration: number;
  };
}
