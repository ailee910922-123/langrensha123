import axios from 'axios';
import { config } from '../config/config';
import { Logger } from '../utils/logger';

export interface TTSConfig {
  provider: 'openai' | 'azure';
  apiKey: string;
  voiceId?: string;
}

export class TTSService {
  private config: TTSConfig;

  constructor() {
    this.config = {
      provider: config.ttsProvider as 'openai' | 'azure',
      apiKey: config.ttsProvider === 'openai' ? config.openaiApiKey : config.azureTtsKey,
      voiceId: 'shimmer',  // OpenAI 語音 ID
    };
  }

  /**
   * 使用 OpenAI TTS 生成語音
   */
  private async generateOpenAIAudio(prompt: string): Promise<Buffer> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: prompt,
          voice: this.config.voiceId || 'shimmer',
          speed: 1.0,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );
      return response.data;
    } catch (error) {
      Logger.error('OpenAI TTS error:', error);
      throw error;
    }
  }

  /**
   * 使用 Azure TTS 生成語音
   */
  private async generateAzureAudio(prompt: string): Promise<Buffer> {
    try {
      const response = await axios.post(
        `https://${config.azureTtsRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
        `<speak version='1.0' xml:lang='zh-TW'>
          <voice name='zh-TW-HsiaoChenNeural'>
            ${prompt}
          </voice>
        </speak>`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.apiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
          },
          responseType: 'arraybuffer',
        }
      );
      return response.data;
    } catch (error) {
      Logger.error('Azure TTS error:', error);
      throw error;
    }
  }

  /**
   * 生成語音（根據配置選擇提供商）
   */
  async generateSpeech(prompt: string): Promise<Buffer> {
    if (!this.config.apiKey) {
      Logger.warn('TTS API Key not configured, returning null');
      return Buffer.alloc(0);
    }

    try {
      if (this.config.provider === 'openai') {
        return await this.generateOpenAIAudio(prompt);
      } else if (this.config.provider === 'azure') {
        return await this.generateAzureAudio(prompt);
      }
      throw new Error(`Unknown TTS provider: ${this.config.provider}`);
    } catch (error) {
      Logger.error(`TTS generation failed: ${error}`);
      throw error;
    }
  }

  /**
   * 保存音頻文件（用於前端下載）
   */
  async saveAudioFile(roomId: string, prompt: string): Promise<{ path: string; success: boolean }> {
    try {
      // 在生產環境中，您可能希望將文件保存到 S3 或其他服務
      // 這裡只是一個示例，實際實現根據需要調整
      Logger.info(`Audio saved for room ${roomId}: ${prompt}`);
      return {
        path: `/audio/${roomId}_${Date.now()}.mp3`,
        success: true,
      };
    } catch (error) {
      Logger.error('Audio save error:', error);
      return { path: '', success: false };
    }
  }
}
