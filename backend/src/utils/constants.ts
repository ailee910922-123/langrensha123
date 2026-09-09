// 遊戲配置常數
export const GAME_CONFIG = {
  MIN_PLAYERS: 6,
  MAX_PLAYERS: 12,
  NIGHT_DURATION: 30,        // 夜晚持續秒數
  DAY_DURATION: 120,          // 白天持續秒數
  ANNOUNCE_DURATION: 10,      // 公布持續秒數
  VOTE_DURATION: 60,          // 投票持續秒數
};

// 房間代碼生成配置
export const ROOM_CODE_CONFIG = {
  LENGTH: 6,
  CHARACTERS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
};

// 角色配置（基於人數）
export const ROLE_CONFIG: Record<number, Record<string, number>> = {
  6: {
    villager: 3,
    werewolf: 1,
    seer: 1,
    witch: 1,
    hunter: 0,
  },
  7: {
    villager: 4,
    werewolf: 1,
    seer: 1,
    witch: 1,
    hunter: 0,
  },
  8: {
    villager: 4,
    werewolf: 2,
    seer: 1,
    witch: 1,
    hunter: 0,
  },
  9: {
    villager: 5,
    werewolf: 2,
    seer: 1,
    witch: 1,
    hunter: 0,
  },
  10: {
    villager: 5,
    werewolf: 2,
    seer: 1,
    witch: 1,
    hunter: 1,
  },
  11: {
    villager: 6,
    werewolf: 2,
    seer: 1,
    witch: 1,
    hunter: 1,
  },
  12: {
    villager: 6,
    werewolf: 3,
    seer: 1,
    witch: 1,
    hunter: 1,
  },
};

// 遊戲狀態轉移
export const STATE_TRANSITIONS: Record<string, string> = {
  LOBBY: 'ROLE_DISTRIBUTION',
  ROLE_DISTRIBUTION: 'NIGHT_WOLF',
  NIGHT_WOLF: 'NIGHT_SEER',
  NIGHT_SEER: 'NIGHT_WITCH',
  NIGHT_WITCH: 'DAY_ANNOUNCE',
  DAY_ANNOUNCE: 'DAY_DISCUSS',
  DAY_DISCUSS: 'DAY_VOTE',
  DAY_VOTE: 'NIGHT_WOLF',  // 循環回到夜晚
};

// 法官台詞範本
export const JUDGE_PROMPTS: Record<string, (dayNightCount: number, deadCount?: number, target?: string) => string> = {
  NIGHT_WOLF: (dayNightCount: number) => 
    `天黑請閉眼，狼人請睜眼，請選擇今晚要殺害的玩家，其他玩家繼續閉眼`,
  NIGHT_SEER: (dayNightCount: number) => 
    `狼人請閉眼，預言家請睜眼，請選擇一位玩家進行查驗`,
  NIGHT_WITCH: (dayNightCount: number, deadCount: number) => 
    `預言家請閉眼，女巫請睜眼，${deadCount > 0 ? '昨晚有玩家被殺害，你可以選擇使用解藥救活他或選擇使用毒藥毒害一位玩家' : '昨晚沒有玩家被殺害，你可以選擇毒害一位玩家'}，其他玩家繼續閉眼`,
  DAY_ANNOUNCE: (dayNightCount: number, deadCount: number) => 
    `天亮了，${deadCount > 0 ? '昨晚死亡的玩家是' : '昨晚沒有玩家死亡，今天是平安夜'}`,
  DAY_DISCUSS: (dayNightCount: number) => 
    `請所有存活玩家進行自由發言和討論，每位玩家有機會闡述自己的立場`,
  DAY_VOTE: (dayNightCount: number) => 
    `投票時間開始，請選擇要投票放逐的玩家，票數最多者將被放逐`,
};
