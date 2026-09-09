import { Logger } from '../utils/logger';

export interface ChatMessage {
  from: string;
  fromNickname: string;
  message: string;
  timestamp: number;
  isPrivate: boolean;
  targetCamp?: string;  // 如果是陣營私聊
}

export class ChatService {
  private roomChats: Map<string, ChatMessage[]> = new Map();  // roomId -> messages
  private campChats: Map<string, Map<string, ChatMessage[]>> = new Map();  // roomId -> (camp -> messages)

  /**
   * 發送公開聊天
   */
  sendPublicMessage(
    roomId: string,
    fromId: string,
    fromNickname: string,
    message: string
  ): ChatMessage {
    if (!this.roomChats.has(roomId)) {
      this.roomChats.set(roomId, []);
    }

    const chatMessage: ChatMessage = {
      from: fromId,
      fromNickname,
      message,
      timestamp: Date.now(),
      isPrivate: false,
    };

    this.roomChats.get(roomId)!.push(chatMessage);
    Logger.info(`Public message in room ${roomId} from ${fromNickname}: ${message}`);
    return chatMessage;
  }

  /**
   * 發送陣營私聊
   */
  sendCampMessage(
    roomId: string,
    camp: string,
    fromId: string,
    fromNickname: string,
    message: string
  ): ChatMessage {
    if (!this.campChats.has(roomId)) {
      this.campChats.set(roomId, new Map());
    }

    const campMap = this.campChats.get(roomId)!;
    if (!campMap.has(camp)) {
      campMap.set(camp, []);
    }

    const chatMessage: ChatMessage = {
      from: fromId,
      fromNickname,
      message,
      timestamp: Date.now(),
      isPrivate: true,
      targetCamp: camp,
    };

    campMap.get(camp)!.push(chatMessage);
    Logger.info(`Camp message in room ${roomId} to ${camp} from ${fromNickname}: ${message}`);
    return chatMessage;
  }

  /**
   * 獲取公開聊天
   */
  getPublicMessages(roomId: string): ChatMessage[] {
    return this.roomChats.get(roomId) || [];
  }

  /**
   * 獲取陣營私聊
   */
  getCampMessages(roomId: string, camp: string): ChatMessage[] {
    const campMap = this.campChats.get(roomId);
    if (!campMap) return [];
    return campMap.get(camp) || [];
  }

  /**
   * 清空聊天紀錄
   */
  clearChatHistory(roomId: string): void {
    this.roomChats.delete(roomId);
    this.campChats.delete(roomId);
    Logger.info(`Chat history cleared for room ${roomId}`);
  }
}
