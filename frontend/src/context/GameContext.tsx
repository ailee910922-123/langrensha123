import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import socketService from '../services/socketService';
import { GameState, RoleType, CampType, PlayerStatus } from '../types';

interface Player {
  id: string;
  nickname: string;
  role?: RoleType;
  camp?: CampType;
  status: PlayerStatus;
  isRoomOwner: boolean;
}

interface GameContextType {
  // 房間狀態
  roomCode: string | null;
  roomId: string | null;
  players: Player[];
  maxPlayers: number;
  isRoomOwner: boolean;
  
  // 遊戲狀態
  gameState: GameState | null;
  dayNightCount: number;
  timeLimit: number;
  
  // 玩家信息
  myRole: RoleType | null;
  myCamp: CampType | null;
  myStatus: PlayerStatus;
  
  // 聊天和通知
  messages: any[];
  notification: { message: string; type: 'info' | 'warning' | 'error' } | null;
  
  // 方法
  joinRoom: (code: string, nickname: string) => void;
  createRoom: (nickname: string, maxPlayers: number) => void;
  leaveRoom: () => void;
  startGame: () => void;
  sendMessage: (message: string, isPrivate?: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

/**
 * 遊戲提供者組件
 * 用途：管理整個遊戲的全域狀態
 * 包括房間、玩家、遊戲進度等所有信息
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();
  
  // 房間狀態
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [isRoomOwner, setIsRoomOwner] = useState(false);
  
  // 遊戲狀態
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [dayNightCount, setDayNightCount] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  
  // 玩家個人信息
  const [myRole, setMyRole] = useState<RoleType | null>(null);
  const [myCamp, setMyCamp] = useState<CampType | null>(null);
  const [myStatus, setMyStatus] = useState<PlayerStatus>('alive');
  
  // 聊天和通知
  const [messages, setMessages] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);

  /**
   * 加入房間
   * 用途：玩家輸入房間代碼加入遊戲
   */
  const joinRoom = useCallback((code: string, nickname: string) => {
    socketService.joinRoom(code, nickname);
  }, []);

  /**
   * 創建房間
   * 用途：玩家創建新的遊戲房間
   */
  const createRoom = useCallback((nickname: string, maxPlayers: number) => {
    socketService.createRoom(nickname, maxPlayers);
  }, []);

  /**
   * 離開房間
   * 用途：玩家退出房間
   */
  const leaveRoom = useCallback(() => {
    socketService.leaveRoom();
    setRoomCode(null);
    setRoomId(null);
    setPlayers([]);
    setGameState(null);
    setMyRole(null);
    setMyCamp(null);
  }, []);

  /**
   * 開始遊戲
   * 用途：房間主人點擊開始遊戲
   */
  const startGame = useCallback(() => {
    socketService.startGame();
  }, []);

  /**
   * 發送訊息
   * 用途：玩家在聊天中發言
   */
  const sendMessage = useCallback(
    (message: string, isPrivate: boolean = false) => {
      if (roomCode) {
        socketService.sendMessage(message, roomCode, isPrivate, myCamp || undefined);
      }
    },
    [roomCode, myCamp]
  );

  /**
   * 監聽Socket事件
   * 用途：接收來自後端的各種遊戲事件
   */
  useEffect(() => {
    if (!socket) return;

    // 房間創建成功
    const handleRoomCreated = (data: any) => {
      setRoomCode(data.code);
      setRoomId(data.roomId);
      setIsRoomOwner(data.isOwner);
    };

    // 房間加入成功
    const handleRoomJoined = (data: any) => {
      setRoomCode(data.code);
      setRoomId(data.roomId);
      setIsRoomOwner(data.isOwner);
    };

    // 房間更新（玩家列表變化）
    const handleRoomUpdated = (data: any) => {
      setPlayers(data.players);
      setMaxPlayers(data.maxPlayers);
      setGameState(data.state);
      setIsRoomOwner(data.ownerSocketId === socket.id);
    };

    // 遊戲開始
    const handleGameStarted = (data: any) => {
      // 遊戲已開始，等待角色分配
    };

    // 角色分配
    const handleRoleAssigned = (data: any) => {
      setMyRole(data.yourRole);
      setMyCamp(data.yourCamp);
    };

    // 遊戲狀態改變
    const handleGameStateChanged = (data: any) => {
      setGameState(data.state);
      setDayNightCount(data.dayNightCount);
      setTimeLimit(data.timeLimit);
    };

    // 接收通知
    const handleNotification = (data: any) => {
      setNotification(data);
      setTimeout(() => setNotification(null), 3000); // 3秒後清除通知
    };

    // 接收訊息
    const handleChatReceived = (data: any) => {
      setMessages((prev) => [...prev, data]);
    };

    // 錯誤處理
    const handleError = (data: any) => {
      setNotification({
        message: data.message,
        type: 'error',
      });
    };

    // 監聽所有事件
    socketService.on('room:created', handleRoomCreated);
    socketService.on('room:joined', handleRoomJoined);
    socketService.on('room:updated', handleRoomUpdated);
    socketService.on('game:started', handleGameStarted);
    socketService.on('game:role-assigned', handleRoleAssigned);
    socketService.on('game:state-changed', handleGameStateChanged);
    socketService.on('notification', handleNotification);
    socketService.on('chat:received', handleChatReceived);
    socketService.on('error', handleError);

    // 清理事件監聽
    return () => {
      socketService.off('room:created', handleRoomCreated);
      socketService.off('room:joined', handleRoomJoined);
      socketService.off('room:updated', handleRoomUpdated);
      socketService.off('game:started', handleGameStarted);
      socketService.off('game:role-assigned', handleRoleAssigned);
      socketService.off('game:state-changed', handleGameStateChanged);
      socketService.off('notification', handleNotification);
      socketService.off('chat:received', handleChatReceived);
      socketService.off('error', handleError);
    };
  }, [socket]);

  return (
    <GameContext.Provider
      value={{
        // 房間狀態
        roomCode,
        roomId,
        players,
        maxPlayers,
        isRoomOwner,
        
        // 遊戲狀態
        gameState,
        dayNightCount,
        timeLimit,
        
        // 玩家信息
        myRole,
        myCamp,
        myStatus,
        
        // 聊天和通知
        messages,
        notification,
        
        // 方法
        joinRoom,
        createRoom,
        leaveRoom,
        startGame,
        sendMessage,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

/**
 * 使用遊戲上下文的Hook
 * 用途：在任何組件中獲取遊戲狀態
 * 例如：const { roomCode, players } = useGame();
 */
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
