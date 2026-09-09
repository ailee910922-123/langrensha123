import { GameState, Room } from '../types/game.types';
import { STATE_TRANSITIONS, GAME_CONFIG } from '../utils/constants';
import { Logger } from '../utils/logger';

export class GameStateService {
  private stateTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * 轉移到下一個狀態
   */
  transitionToNextState(currentState: GameState): GameState {
    const nextState = STATE_TRANSITIONS[currentState];
    if (!nextState) {
      throw new Error(`No transition defined for state: ${currentState}`);
    }
    Logger.info(`Game state transition: ${currentState} -> ${nextState}`);
    return nextState as GameState;
  }

  /**
   * 獲取當前狀態的時限（秒）
   */
  getStateDuration(state: GameState): number {
    switch (state) {
      case GameState.NIGHT_WOLF:
      case GameState.NIGHT_SEER:
      case GameState.NIGHT_WITCH:
        return GAME_CONFIG.NIGHT_DURATION;
      case GameState.DAY_ANNOUNCE:
        return GAME_CONFIG.ANNOUNCE_DURATION;
      case GameState.DAY_DISCUSS:
        return GAME_CONFIG.DAY_DURATION;
      case GameState.DAY_VOTE:
        return GAME_CONFIG.VOTE_DURATION;
      default:
        return 0;
    }
  }

  /**
   * 設置狀態計時器
   */
  setStateTimer(
    roomId: string,
    state: GameState,
    onTimeout: () => void
  ): void {
    const duration = this.getStateDuration(state);
    if (duration === 0) return;

    // 清除舊計時器
    this.clearTimer(roomId);

    const timerId = setTimeout(() => {
      Logger.info(`State timeout for room ${roomId} in state ${state}`);
      onTimeout();
    }, duration * 1000);

    this.stateTimers.set(roomId, timerId);
  }

  /**
   * 清除計時器
   */
  clearTimer(roomId: string): void {
    const timer = this.stateTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.stateTimers.delete(roomId);
    }
  }

  /**
   * 獲取狀態描述
   */
  getStateDescription(state: GameState, dayNightCount: number): string {
    switch (state) {
      case GameState.LOBBY:
        return '等待中';
      case GameState.ROLE_DISTRIBUTION:
        return '發放身分';
      case GameState.NIGHT_WOLF:
        return `第 ${Math.ceil(dayNightCount / 2)} 個晚上 - 狼人選擇目標`;
      case GameState.NIGHT_SEER:
        return `第 ${Math.ceil(dayNightCount / 2)} 個晚上 - 預言家查驗`;
      case GameState.NIGHT_WITCH:
        return `第 ${Math.ceil(dayNightCount / 2)} 個晚上 - 女巫用藥`;
      case GameState.DAY_ANNOUNCE:
        return `第 ${Math.ceil(dayNightCount / 2)} 天 - 公布死訊`;
      case GameState.DAY_DISCUSS:
        return `第 ${Math.ceil(dayNightCount / 2)} 天 - 白天發言`;
      case GameState.DAY_VOTE:
        return `第 ${Math.ceil(dayNightCount / 2)} 天 - 投票放逐`;
      case GameState.GAME_OVER:
        return '遊戲結束';
      default:
        return '未知狀態';
    }
  }

  /**
   * 判斷特定玩家是否需要執行操作
   */
  shouldPlayerAct(state: GameState, playerRole: string): boolean {
    switch (state) {
      case GameState.NIGHT_WOLF:
        return playerRole === 'werewolf';
      case GameState.NIGHT_SEER:
        return playerRole === 'seer';
      case GameState.NIGHT_WITCH:
        return playerRole === 'witch';
      case GameState.DAY_VOTE:
      case GameState.DAY_DISCUSS:
        return true;  // 所有存活玩家都可以參與
      default:
        return false;
    }
  }
}
