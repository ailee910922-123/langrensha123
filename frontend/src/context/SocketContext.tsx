import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  socketId: string | null;
  isConnected: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

/**
 * Socket提供者組件
 * 用途：在整個應用中提供Socket連線實例
 * 這樣所有組件都可以使用Socket.io進行即時通訊
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * 連接Socket
     * 應用啟動時自動連接到後端伺服器
     */
    const connectSocket = async () => {
      try {
        const connectedSocket = await socketService.connect();
        setSocket(connectedSocket);
        setSocketId(connectedSocket.id);
        setIsConnected(true);
        console.log('Socket connected:', connectedSocket.id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        setError(errorMessage);
        console.error('Failed to connect socket:', err);
      }
    };

    connectSocket();

    /**
     * 清理函數
     * 當組件卸載時斷開連接
     */
    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  /**
   * 監聽連接事件
   */
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleError = (error: any) => {
      setError(error?.message || 'Unknown error');
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('error', handleError);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('error', handleError);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, socketId, isConnected, error }}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * 使用Socket上下文的Hook
 * 用途：在任何組件中獲取Socket實例和狀態
 * 例如：const { socket, isConnected } = useSocket();
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
