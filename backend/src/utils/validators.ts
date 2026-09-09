/**
 * 驗證房間代碼格式
 */
export function validateRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4,6}$/.test(code);
}

/**
 * 驗證暱稱
 */
export function validateNickname(nickname: string): boolean {
  if (!nickname || typeof nickname !== 'string') return false;
  const trimmed = nickname.trim();
  return trimmed.length >= 2 && trimmed.length <= 20;
}

/**
 * 驗證玩家數量
 */
export function validatePlayerCount(count: number): boolean {
  return count >= 6 && count <= 12;
}

/**
 * 驗證玩家 ID
 */
export function validatePlayerId(id: string): boolean {
  return typeof id === 'string' && id.length > 0;
}
