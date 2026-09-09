import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GameState } from '../types';

/**
 * 房間大廳組件
 * 用途：玩家在遊戲開始前等待的地方
 * 顯示：
 *   - 房間代碼
 *   - 玩家列表
 *   - 開始遊戲按鈕（僅房主可用）
 *   - 離開房間按鈕
 */
function RoomLobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { roomCode, players, isRoomOwner, startGame, leaveRoom, gameState } = useGame();
  const [copied, setCopied] = useState(false);

  /**
   * 監聽遊戲狀態變化
   * 用途：當遊戲開始時自動導航到遊戲頁面
   */
  useEffect(() => {
    if (gameState === GameState.ROLE_DISTRIBUTION) {
      // 等待一秒讓前端狀態同步
      const timer = setTimeout(() => {
        navigate(`/game/${roomCode}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, roomCode, navigate]);

  /**
   * 處理複製房間代碼
   * 用途：讓玩家方便地分享房間代碼給其他玩家
   */
  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * 處理開始遊戲
   * 用途：房主點擊開始遊戲
   */
  const handleStartGame = () => {
    if (players.length < 6) {
      alert('至少需要 6 名玩家才能開始遊戲');
      return;
    }
    startGame();
  };

  /**
   * 處理離開房間
   * 用途：玩家退出房間回到首頁
   */
  const handleLeaveRoom = () => {
    if (confirm('確定要離開房間嗎？')) {
      leaveRoom();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center">
      {/* 標題 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">房間等待中...</h1>
        <p className="text-gray-400">等待其他玩家加入</p>
      </div>

      {/* 房間代碼卡片 */}
      <div className="w-full max-w-md bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-6 mb-8 shadow-lg">
        <p className="text-gray-300 text-sm mb-2">房間代碼</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-4xl font-bold text-white tracking-wider">{roomCode}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-semibold transition-colors"
          >
            {copied ? '✓ 已複製' : '複製'}
          </button>
        </div>
      </div>

      {/* 玩家列表 */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            玩家列表 ({players.length}/{6})
          </h2>
        </div>

        {/* 玩家卡片網格 */}
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{player.nickname}</p>
                  {player.isRoomOwner && (
                    <p className="text-xs text-yellow-400">👑 房主</p>
                  )}
                </div>
              </div>
              <div className="text-green-400 text-sm">✓ 已準備</div>
            </div>
          ))}

          {/* 空位顯示 */}
          {players.length < 6 &&
            Array.from({ length: 6 - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-dashed border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-500">
                    ?
                  </div>
                  <p className="text-gray-500 italic">等待加入...</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="w-full max-w-md flex gap-4">
        {isRoomOwner ? (
          <>
            <button
              onClick={handleStartGame}
              disabled={players.length < 6}
              className={`flex-1 py-3 rounded-lg font-bold text-white transition-all ${
                players.length < 6
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/50'
              }`}
            >
              🎮 開始遊戲
            </button>
            <button
              onClick={handleLeaveRoom}
              className="flex-1 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              🚪 離開房間
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 py-3 rounded-lg font-bold text-white bg-gray-600 text-center">
              ⏳ 等待房主開始
            </div>
            <button
              onClick={handleLeaveRoom}
              className="flex-1 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              🚪 離開房間
            </button>
          </>
        )}
      </div>

      {/* 幫助提示 */}
      <div className="mt-12 max-w-md text-center text-gray-400 text-sm">
        <p>💡 分享房間代碼給朋友讓他們加入</p>
        <p>⏱️ 等待至少 6 名玩家後即可開始遊戲</p>
      </div>
    </div>
  );
}

export default RoomLobby;
