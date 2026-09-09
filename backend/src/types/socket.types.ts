import { RoleType, GameState, PlayerStatus, CampType } from './game.types';

// Socket 事件：房間操作
export interface SocketEvents {
  // 房間事件
  'room:create': (data: { nickname: string; maxPlayers: number }) => void;
  'room:join': (data: { code: string; nickname: string }) => void;
  'room:leave': () => void;
  'room:start': () => void;
  'room:updated': (data: RoomUpdatePayload) => void;

  // 遊戲狀態事件
  'game:state-changed': (data: GameStatePayload) => void;
  'game:role-assigned': (data: RoleAssignmentPayload) => void;
  'game:day-night-announce': (data: DayNightAnnouncePayload) => void;
  'game:death-announced': (data: DeathAnnouncementPayload) => void;
  'game:over': (data: GameOverPayload) => void;

  // 技能事件
  'skill:wolf-select': (data: { targetId: string }) => void;
  'skill:seer-check': (data: { targetId: string }) => void;
  'skill:witch-use': (data: { antidoteTarget?: string; poisonTarget?: string }) => void;
  'skill:hunter-shoot': (data: { targetId: string }) => void;

  // 投票事件
  'vote:cast': (data: { targetId: string }) => void;
  'vote:results': (data: VoteResultsPayload) => void;

  // 聊天事件
  'chat:send': (data: { message: string; roomCode: string; isPrivate: boolean; targetCamp?: string }) => void;
  'chat:received': (data: ChatMessagePayload) => void;

  // 系統事件
  'error': (data: { message: string; code?: string }) => void;
  'notification': (data: { message: string; type: 'info' | 'warning' | 'error' }) => void;
}

// 房間更新載荷
export interface RoomUpdatePayload {
  code: string;
  playerCount: number;
  players: PlayerInfoPayload[];
  state: GameState;
  ownerSocketId: string;
  maxPlayers: number;
}

// 玩家資訊載荷
export interface PlayerInfoPayload {
  id: string;
  nickname: string;
  status: PlayerStatus;
  isRoomOwner: boolean;
}

// 遊戲狀態載荷
export interface GameStatePayload {
  state: GameState;
  dayNightCount: number;
  timeLimit: number;
  currentPhaseDescription: string;
  relevantPlayers?: string[];  // 需要執行行動的玩家 ID
}

// 角色分配載荷
export interface RoleAssignmentPayload {
  yourRole: RoleType;
  yourCamp: CampType;
  allPlayers: {
    id: string;
    nickname: string;
    role?: RoleType;  // 只在遊戲結束時才透露所有玩家角色
    status: PlayerStatus;
  }[];
}

// 日夜公告載荷
export interface DayNightAnnouncePayload {
  type: 'day' | 'night';
  dayNightCount: number;
  voicePrompt: string;  // 法官台詞
  audioUrl?: string;    // 語音音檔 URL
  duration: number;     // 時長（秒）
}

// 死亡公告載荷
export interface DeathAnnouncementPayload {
  deadPlayers: {
    id: string;
    nickname: string;
    role: RoleType;
    lastWords?: string;
    killedBy: 'wolf' | 'witch' | 'vote';
  }[];
  dayNightCount: number;
}

// 投票結果載荷
export interface VoteResultsPayload {
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

// 遊戲結束載荷
export interface GameOverPayload {
  winner: 'good' | 'evil';
  winnerPlayers: Array<{
    id: string;
    nickname: string;
    role: RoleType;
    camp: CampType;
  }>;
  loserPlayers: Array<{
    id: string;
    nickname: string;
    role: RoleType;
    camp: CampType;
  }>;
  gameStats: {
    totalDays: number;
    totalDeaths: number;
    duration: number;
  };
}

// 聊天訊息載荷
export interface ChatMessagePayload {
  from: string;
  fromNickname: string;
  message: string;
  timestamp: number;
  isPrivate: boolean;
  targetCamp?: string;  // 如果是陣營私聊
}
