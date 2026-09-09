import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { GameState } from '../types';
import socketService from '../services/socketService';

/**
 * 遊戲主畫面組件
 * 用途：顯示遊戲進行中的所有信息和操作界面
 * 顯示：
 *   - 玩家網格（所有玩家狀態）
 *   - 遊戲狀態和倒計時
 *   - 技能操作區（根據角色顯示）
 *   - 投票區域（白天投票）
 *   - 聊天框（玩家溝通）
 */
function GameBoard() {
  const { code } = useParams<{ code: string }>();
  const {
    roomCode,
    players,
    gameState,
    dayNightCount,
    timeLimit,
    myRole,
    myCamp,
    myStatus,
    messages,
    notification,
    sendMessage,
  } = useGame();

  // 聊天消息輸入狀態
  const [chatInput, setChatInput] = useState('');
  const [remainingTime, setRemainingTime] = useState(timeLimit);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  /**
   * 倒計時效果
   * 用途：顯示當前階段的剩餘時間
   */
  useEffect(() => {
    setRemainingTime(timeLimit);
    const timer = setInterval(() => {
      setRemainingTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit]);

  /**
   * 處理發送聊天消息
   * 用途：玩家在聊天框輸入並發送消息
   */
  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  /**
   * 判斷玩家是否應該行動
   * 用途：根據遊戲狀態和玩家角色決定是否顯示操作按鈕
   */
  const shouldPlayerAct = () => {
    if (myStatus === 'dead') return false;

    switch (gameState) {
      case GameState.NIGHT_WOLF:
        return myRole === 'werewolf';
      case GameState.NIGHT_SEER:
        return myRole === 'seer';
      case GameState.NIGHT_WITCH:
        return myRole === 'witch';
      case GameState.DAY_VOTE:
        return true; // 所有活著的玩家都能投票
      default:
        return false;
    }
  };

  /**
   * 處理狼人選擇目標
   * 用途：狼人在夜間選擇要殺害的玩家
   */
  const handleWolfSelect = (targetId: string) => {
    setSelectedTarget(targetId);
    socketService.wolfSelectTarget(targetId);
  };

  /**
   * 處理預言家查驗
   * 用途：預言家在夜間查驗一名玩家的身份
   */
  const handleSeerCheck = (targetId: string) => {
    setSelectedTarget(targetId);
    socketService.seerCheckPlayer(targetId);
  };

  /**
   * 處理投票
   * 用途：玩家在白天投票放逐一人
   */
  const handleVote = (targetId: string) => {
    setSelectedTarget(targetId);
    socketService.castVote(targetId);
  };

  /**
   * 獲取遊戲狀態描述
   * 用途：顯示人類可讀的遊戲階段信息
   */
  const getStateDescription = () => {
    switch (gameState) {
      case GameState.LOBBY:
        return '準備中';
      case GameState.ROLE_DISTRIBUTION:
        return '分配角色中';
      case GameState.NIGHT_WOLF:
        return `第 ${dayNightCount} 晚 - 狼人殺人時間`;
      case GameState.NIGHT_SEER:
        return `第 ${dayNightCount} 晚 - 預言家查驗時間`;
      case GameState.NIGHT_WITCH:
        return `第 ${dayNightCount} 晚 - 女巫用藥時間`;
      case GameState.DAY_ANNOUNCE:
        return `第 ${Math.ceil(dayNightCount / 2)} 天 - 宣布死訊`;
      case GameState.DAY_DISCUSS:
        return `第 ${Math.ceil(dayNightCount / 2)} 天 - 討論時間`;
      case GameState.DAY_VOTE:
        return `第 ${Math.ceil(dayNightCount / 2)} 天 - 投票時間`;
      case GameState.GAME_OVER:
        return '遊戲結束';
      default:
        return '進行中';
    }
  };

  return (
    <div className="min-h-screen p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* 主遊戲區域 */}
      <div className="lg:col-span-3">
        {/* 狀態條 */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 mb-6 shadow-lg border border-purple-700">
          <div className="grid grid-cols-3 gap-4">
            {/* 房間信息 */}
            <div>
              <p className="text-gray-400 text-sm">房間代碼</p>
              <p className="text-2xl font-bold text-white">{roomCode}</p>
            </div>

            {/* 遊戲狀態 */}
            <div>
              <p className="text-gray-400 text-sm">當前階段</p>
              <p className="text-2xl font-bold text-purple-300">{getStateDescription()}</p>
            </div>

            {/* 倒計時 */}
            <div>
              <p className="text-gray-400 text-sm">剩餘時間</p>
              <p className={`text-4xl font-bold ${
                remainingTime <= 10 ? 'text-red-500' : 'text-yellow-400'
              }`}>
                {remainingTime}s
              </p>
            </div>
          </div>
        </div>

        {/* 玩家網格 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🎭 玩家狀態</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                onClick={() => {
                  if (shouldPlayerAct() && player.id !== (socketService.getSocketId() || '') && player.status === 'alive') {
                    if (gameState === GameState.NIGHT_WOLF) handleWolfSelect(player.id);
                    else if (gameState === GameState.NIGHT_SEER) handleSeerCheck(player.id);
                    else if (gameState === GameState.DAY_VOTE) handleVote(player.id);
                  }
                }}
                className={`p-4 rounded-lg text-center cursor-pointer transition-all border-2 ${
                  player.status === 'dead'
                    ? 'bg-gray-700 border-gray-600 opacity-50'
                    : selectedTarget === player.id
                    ? 'bg-yellow-600 border-yellow-400 shadow-lg shadow-yellow-500/50'
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-500 hover:border-purple-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold mx-auto mb-2">
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <p className="text-white font-semibold text-sm truncate">{player.nickname}</p>
                <p className="text-xs text-gray-300">
                  {player.status === 'dead' ? '💀 已死亡' : '✓ 活著'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 技能操作區 */}
        {shouldPlayerAct() && myStatus === 'alive' && (
          <div className="bg-blue-900 rounded-lg p-6 mb-6 border border-blue-700">
            <h3 className="text-lg font-bold text-white mb-4">
              {gameState === GameState.NIGHT_WOLF && '🐺 狼人：選擇目標'}
              {gameState === GameState.NIGHT_SEER && '🔮 預言家：選擇要查驗的玩家'}
              {gameState === GameState.NIGHT_WITCH && '✨ 女巫：使用技能'}
              {gameState === GameState.DAY_VOTE && '🗳️ 投票：選擇放逐的玩家'}
            </h3>
            <p className="text-gray-300 text-sm">
              {selectedTarget ? '已選擇目標，等待其他玩家...' : '點擊上方玩家卡片選擇目標'}
            </p>
          </div>
        )}

        {/* 通知消息 */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg text-white font-semibold ${
            notification.type === 'error' ? 'bg-red-600' : 
            notification.type === 'warning' ? 'bg-yellow-600' : 
            'bg-green-600'
          }`}>
            {notification.message}
          </div>
        )}
      </div>

      {/* 右側邊欄 - 聊天和玩家信息 */}
      <div className="lg:col-span-1 space-y-4">
        {/* 玩家個人信息 */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">你的身份</h3>
          <div className="space-y-2">
            <div>
              <p className="text-gray-400 text-sm">角色</p>
              <p className="text-white font-bold text-lg">
                {myRole === 'werewolf' && '🐺 狼人'}
                {myRole === 'seer' && '🔮 預言家'}
                {myRole === 'witch' && '✨ 女巫'}
                {myRole === 'hunter' && '🏹 獵人'}
                {myRole === 'villager' && '👨 平民'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">陣營</p>
              <p className={`text-white font-bold text-lg ${
                myCamp === 'good' ? 'text-green-400' : 'text-red-400'
              }`}>
                {myCamp === 'good' ? '✓ 好人陣營' : '✗ 狼人陣營'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">狀態</p>
              <p className="text-white font-bold text-lg">
                {myStatus === 'dead' ? '💀 已死亡' : '✓ 活著'}
              </p>
            </div>
          </div>
        </div>

        {/* 聊天框 */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col h-96">
          <h3 className="text-lg font-bold text-white mb-3">💬 聊天</h3>
          
          {/* 聊天記錄 */}
          <div className="flex-1 overflow-y-auto mb-3 space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`text-xs p-2 rounded ${
                msg.isPrivate ? 'bg-purple-900 text-purple-100' : 'bg-gray-700 text-gray-200'
              }`}>
                <p className="font-semibold">{msg.fromNickname}</p>
                <p className="break-words">{msg.message}</p>
              </div>
            ))}
          </div>

          {/* 聊天輸入 */}
          {myStatus === 'alive' && gameState !== GameState.LOBBY && gameState !== GameState.GAME_OVER && (
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="輸入消息..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-semibold text-sm"
              >
                發送
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
