import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // 遊戲配置
  minPlayers: parseInt(process.env.MIN_PLAYERS || '6', 10),
  maxPlayers: parseInt(process.env.MAX_PLAYERS || '12', 10),
  nightDuration: parseInt(process.env.NIGHT_DURATION || '30', 10),
  dayDuration: parseInt(process.env.DAY_DURATION || '120', 10),
  
  // TTS 配置
  ttsProvider: process.env.TTS_PROVIDER || 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  azureTtsKey: process.env.AZURE_TTS_KEY || '',
  azureTtsRegion: process.env.AZURE_TTS_REGION || 'eastasia',
};
