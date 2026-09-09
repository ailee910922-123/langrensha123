import { v4 as uuidv4 } from 'uuid';
import { Room, Player, GameState, PlayerStatus, RoleType, CampType } from '../types/game.types';
import { ROOM_CODE_CONFIG, GAME_CONFIG } from '../utils/constants';
import { validateRoomCode, validateNickname } from '../utils/validators';
import { Logger } from '../utils/logger';

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private codeToRoomId: Map<string, string> = new Map();

  /**
   * 生成唯一的房間代碼
   */
  private generateRoomCode(): string {
    let code: string;
    do {
      code = '';
      for (let i = 0; i < ROOM_CODE_CONFIG.LENGTH; i++) {
        code += ROOM_CODE_CONFIG.CHARACTERS.charAt(
          Math.floor(Math.random() * ROOM_CODE_CONFIG.CHARACTERS.length)
        );
      }
    } while (this.codeToRoomId.has(code));
    return code;
  }

  /**
   * 建立房間
   */
  createRoom(ownerSocketId: string, ownerNickname: string, maxPlayers: number = 6): Room {
    if (maxPlayers < GAME_CONFIG.MIN_PLAYERS || maxPlayers > GAME_CONFIG.MAX_PLAYERS) {
      throw new Error(`Invalid player count: ${maxPlayers}`);
    }

    if (!validateNickname(ownerNickname)) {
      throw new Error('Invalid nickname');
    }

    const roomId = uuidv4();
    const code = this.generateRoomCode();
    
    const owner: Player = {
      id: ownerSocketId,
      nickname: ownerNickname,
      role: null,
      camp: null,
      status: PlayerStatus.ALIVE,
      isRoomOwner: true,
      skillUsed: {
        seerCheck: false,
        witchAntidote: false,
        witchPoison: false,
      },
    };

    const room: Room = {
      id: roomId,
      code,
      players: new Map([[ownerSocketId, owner]]),
      ownerSocketId,
      state: GameState.LOBBY,
      dayNightCount: 0,
      createdAt: Date.now(),
      maxPlayers,
    };

    this.rooms.set(roomId, room);
    this.codeToRoomId.set(code, roomId);

    Logger.info(`Room created: ${code} (ID: ${roomId}) by ${ownerNickname}`);
    return room;
  }

  /**
   * 根據房間代碼獲取房間
   */
  getRoomByCode(code: string): Room | null {
    if (!validateRoomCode(code)) {
      return null;
    }
    const roomId = this.codeToRoomId.get(code);
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  /**
   * 根據房間 ID 獲取房間
   */
  getRoomById(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * 根據玩家 Socket ID 獲取房間
   */
  getRoomByPlayerId(playerId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return null;
  }

  /**
   * 玩家加入房間
   */
  addPlayerToRoom(code: string, playerId: string, nickname: string): { room: Room; success: boolean; message: string } {
    const room = this.getRoomByCode(code);
    if (!room) {
      return { room: null as any, success: false, message: 'Room not found' };
    }

    if (room.players.size >= room.maxPlayers) {
      return { room, success: false, message: 'Room is full' };
    }

    if (room.state !== GameState.LOBBY) {
      return { room, success: false, message: 'Game has already started' };
    }

    if (!validateNickname(nickname)) {
      return { room, success: false, message: 'Invalid nickname' };
    }

    // 檢查暱稱是否重複
    for (const player of room.players.values()) {
      if (player.nickname === nickname) {
        return { room, success: false, message: 'Nickname already exists in room' };
      }
    }

    const newPlayer: Player = {
      id: playerId,
      nickname,
      role: null,
      camp: null,
      status: PlayerStatus.ALIVE,
      isRoomOwner: false,
      skillUsed: {
        seerCheck: false,
        witchAntidote: false,
        witchPoison: false,
      },
    };

    room.players.set(playerId, newPlayer);
    Logger.info(`Player ${nickname} joined room ${code}`);
    return { room, success: true, message: 'Successfully joined room' };
  }

  /**
   * 玩家離開房間
   */
  removePlayerFromRoom(playerId: string): { room: Room; success: boolean } {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) {
      return { room: null as any, success: false };
    }

    const player = room.players.get(playerId);
    if (!player) {
      return { room, success: false };
    }

    room.players.delete(playerId);
    Logger.info(`Player ${player.nickname} left room ${room.code}`);

    // 如果房主離開，轉移房主權或刪除房間
    if (player.isRoomOwner) {
      if (room.players.size > 0) {
        const newOwner = room.players.values().next().value;
        newOwner.isRoomOwner = true;
        room.ownerSocketId = newOwner.id;
        Logger.info(`Room owner changed to ${newOwner.nickname}`);
      } else {
        // 房間為空，刪除房間
        this.codeToRoomId.delete(room.code);
        this.rooms.delete(room.id);
        Logger.info(`Empty room deleted: ${room.code}`);
      }
    }

    return { room, success: true };
  }

  /**
   * 獲取房間內所有玩家
   */
  getRoomPlayers(roomId: string): Player[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.players.values()) : [];
  }

  /**
   * 獲取房間內的存活玩家
   */
  getAlivePlayers(roomId: string): Player[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.players.values()).filter(p => p.status === PlayerStatus.ALIVE);
  }

  /**
   * 更新房間狀態
   */
  updateRoomState(roomId: string, newState: GameState): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.state = newState;
    return room;
  }

  /**
   * 更新玩家狀態
   */
  updatePlayerStatus(roomId: string, playerId: string, status: PlayerStatus): Player | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const player = room.players.get(playerId);
    if (!player) return null;
    player.status = status;
    return player;
  }

  /**
   * 分配玩家角色
   */
  assignPlayerRole(roomId: string, playerId: string, role: RoleType, camp: CampType): Player | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const player = room.players.get(playerId);
    if (!player) return null;
    player.role = role;
    player.camp = camp;
    return player;
  }
}
