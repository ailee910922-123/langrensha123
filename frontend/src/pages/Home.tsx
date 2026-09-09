import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

/**
 * 首頁組件
 * 用途：玩家創建新房間或加入現有房間的入口
 * 顯示：
 *   - 創建房間的表單
 *   - 加入房間的表單
 *   - 遊戲標題和介紹
 */
function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useGame();

  // 創建房間的狀態
  const [createFormData, setCreateFormData] = useState({
    nickname: '',
    maxPlayers: 6,
  });

  // 加入房間的狀態
  const [joinFormData, setJoinFormData] = useState({
    nickname: '',
    roomCode: '',
  });

  // 顯示的標籤頁（創建或加入）
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  /**
   * 處理創建房間
   * 用途：玩家輸入暱稱和最大玩家數後創建房間
   */
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.nickname.trim()) {
      alert('請輸入暱稱');
      return;
    }

    createRoom(createFormData.nickname, createFormData.maxPlayers);
    // 創建成功後，會由後端返回房間代碼
    // GameContext 會自動更新並導航到 /lobby/:code
  };

  /**
   * 處理加入房間
   * 用途：玩家輸入房間代碼和暱稱後加入房間
   */
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinFormData.nickname.trim()) {
      alert('請輸入暱稱');
      return;
    }

    if (!joinFormData.roomCode.trim()) {
      alert('請輸入房間代碼');
      return;
    }

    joinRoom(joinFormData.roomCode, joinFormData.nickname);
    // 加入成功後，會由後端返回房間信息
    // GameContext 會自動更新並導航到 /lobby/:code
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* 遊戲標題 */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
          🐺 狼人殺遊戲
        </h1>
        <p className="text-xl text-gray-300">
          與朋友一起玩經典的策略推理遊戲
        </p>
      </div>

      {/* 主容器 */}
      <div className="w-full max-w-md">
        {/* 標籤頁切換 */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-4 font-semibold text-lg transition-colors ${
              activeTab === 'create'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            創建房間
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-4 font-semibold text-lg transition-colors ${
              activeTab === 'join'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            加入房間
          </button>
        </div>

        {/* 創建房間表單 */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            {/* 暱稱輸入框 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                你的暱稱
              </label>
              <input
                type="text"
                value={createFormData.nickname}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, nickname: e.target.value })
                }
                placeholder="輸入你的暱稱..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* 最大玩家數選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最大玩家數
              </label>
              <select
                value={createFormData.maxPlayers}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, maxPlayers: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value={6}>6 人</option>
                <option value={7}>7 人</option>
                <option value={8}>8 人</option>
                <option value={9}>9 人</option>
                <option value={10}>10 人</option>
              </select>
            </div>

            {/* 提交按鈕 */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all mt-6"
            >
              創建房間
            </button>
          </form>
        )}

        {/* 加入房間表單 */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            {/* 房間代碼輸入框 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                房間代碼
              </label>
              <input
                type="text"
                value={joinFormData.roomCode}
                onChange={(e) =>
                  setJoinFormData({ ...joinFormData, roomCode: e.target.value.toUpperCase() })
                }
                placeholder="輸入房間代碼..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 uppercase"
              />
            </div>

            {/* 暱稱輸入框 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                你的暱稱
              </label>
              <input
                type="text"
                value={joinFormData.nickname}
                onChange={(e) =>
                  setJoinFormData({ ...joinFormData, nickname: e.target.value })
                }
                placeholder="輸入你的暱稱..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* 提交按鈕 */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all mt-6"
            >
              加入房間
            </button>
          </form>
        )}
      </div>

      {/* 遊戲說明 */}
      <div className="mt-16 max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-white mb-4">遊戲玩法</h2>
        <ul className="text-gray-300 space-y-2 text-left">
          <li>🎭 每個玩家獲得一個秘密身分</li>
          <li>🌙 夜間階段，狼人秘密殺害一名玩家</li>
          <li>☀️ 白天階段，所有玩家投票放逐一人</li>
          <li>🔮 神職者使用特殊能力幫助村民</li>
          <li>🏆 消滅所有狼人或狼人達到多數時遊戲結束</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
