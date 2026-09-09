import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  /**
   * 連接到Socket.io伺服器
   * 用途：建立前端與後端的即時通訊連線
   */
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(SOCKET_URL, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to server:', this.socket?.id);
          resolve(this.socket!);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 斷開連接
   * 用途：關閉與伺服器的連線
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 取得Socket實例
   * 用途：獲取當前的Socket連線物件
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * 取得Socket ID
   * 用途：獲取玩家的唯一標識符
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * 監聽事件
   * 用途：接收來自伺服器的事件
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * 移除事件監聽
   * 用途：停止接收特定事件
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * 發送事件給伺服器
   * 用途：向後端發送玩家操作或數據
   */
  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * 發送事件並等待回應
   * 用途：向後端發送事件並獲得回覆
   */
  emitWithCallback(event: string, data?: any, callback?: (...args: any[]) => void): void {
    if (this.socket && callback) {
      this.socket.emit(event, data, callback);
    }
  }

  // ==================== 房間相關事件 ====================

  /**
   * 創建房間
   * 用途：玩家創建新的遊戲房間
   */
  createRoom(nickname: string, maxPlayers: number): void {
    this.emit('room:create', { nickname, maxPlayers });
  }

  /**
   * 加入房間
   * 用途：玩家輸入房間代碼加入遊戲
   */
  joinRoom(code: string, nickname: string): void {
    this.emit('room:join', { code, nickname });
  }

  /**
   * 離開房間
   * 用途：玩家退出房間
   */
  leaveRoom(): void {
    this.emit('room:leave');
  }

  /**
   * 開始遊戲
   * 用途：房間主人開始遊戲
   */
  startGame(): void {
    this.emit('room:start');
  }

  // ==================== 遊戲相關事件 ====================

  /**
   * 進入下一個遊戲狀態
   * 用途：轉移到下一個遊戲階段（夜晚→白天等）
   */
  nextGameState(): void {
    this.emit('game:next-state');
  }

  /**
   * 檢查遊戲是否結束
   * 用途：查詢遊戲勝敗狀態
   */
  checkGameEnd(): void {
    this.emit('game:check-end');
  }

  // ==================== 技能相關事件 ====================

  /**
   * 狼人選擇殺害目標
   * 用途：狼人在夜間選擇要殺誰
   */
  wolfSelectTarget(targetId: string): void {
    this.emit('skill:wolf-select', { targetId });
  }

  /**
   * 預言家查驗玩家
   * 用途：預言家在夜間查驗某玩家身份
   */
  seerCheckPlayer(targetId: string): void {
    this.emit('skill:seer-check', { targetId });
  }

  /**
   * 女巫使用技能
   * 用途：女巫在夜間使用解毒或下毒
   */
  witchUseSkill(antidoteTarget?: string, poisonTarget?: string): void {
    this.emit('skill:witch-use', { antidoteTarget, poisonTarget });
  }

  /**
   * 獵人開槍
   * 用途：獵人死亡時開槍殺死其他玩家
   */
  hunterShoot(targetId: string): void {
    this.emit('skill:hunter-shoot', { targetId });
  }

  // ==================== 投票相關事件 ====================

  /**
   * 投票
   * 用途：白天投票放逐玩家
   */
  castVote(targetId: string): void {
    this.emit('vote:cast', { targetId });
  }

  /**
   * 取消投票
   * 用途：玩家改變主意取消投票
   */
  cancelVote(): void {
    this.emit('vote:cancel');
  }

  /**
   * 結束投票
   * 用途：統計投票結果
   */
  concludeVoting(): void {
    this.emit('vote:conclude');
  }

  // ==================== 聊天相關事件 ====================

  /**
   * 發送聊天訊息
   * 用途：玩家在公開或私密聊天中發言
   */
  sendMessage(message: string, roomCode: string, isPrivate: boolean = false, targetCamp?: string): void {
    this.emit('chat:send', { message, roomCode, isPrivate, targetCamp });
  }

  /**
   * 取得聊天歷史
   * 用途：獲取之前的聊天記錄
   */
  getChatHistory(roomCode: string, isPrivate: boolean = false, targetCamp?: string): void {
    this.emit('chat:get-history', { roomCode, isPrivate, targetCamp });
  }
}

export default new SocketService();
