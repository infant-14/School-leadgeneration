import { Controller, Get, Post, Body, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Controller('config')
export class ConfigController {
  private readonly envPath = (() => {
    const localEnv = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(localEnv)) return localEnv;
    const backendEnv = path.resolve(process.cwd(), 'backend/.env');
    if (fs.existsSync(backendEnv)) return backendEnv;
    return path.resolve(__dirname, '../../../../.env');
  })();

  @Get()
  getConfig() {
    const key = process.env.GEMINI_API_KEY || '';
    const maskedKey = key ? `${key.substring(0, 10)}...` : '';
    
    return {
      gemini_api_key: maskedKey,
      google_sheet_id: process.env.GOOGLE_SHEET_ID || '',
      ai_provider: process.env.AI_PROVIDER || 'none',
      ollama_base_url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      ollama_model: process.env.OLLAMA_MODEL || 'llama3.2',
      ollama_vision_model: process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision',
    };
  }

  @Post()
  updateConfig(
    @Body('gemini_api_key') geminiKey?: string,
    @Body('google_sheet_id') googleSheetId?: string,
    @Body('ai_provider') aiProvider?: string,
    @Body('ollama_base_url') ollamaBaseUrl?: string,
    @Body('ollama_model') ollamaModel?: string,
    @Body('ollama_vision_model') ollamaVisionModel?: string,
  ) {
    try {
      let envLines: string[] = [];
      if (fs.existsSync(this.envPath)) {
        envLines = fs.readFileSync(this.envPath, 'utf8').split('\n');
      }

      const envDict: { [key: string]: string } = {};
      for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, v] = trimmed.split('=', 2);
          envDict[k.trim()] = v.trim();
        }
      }

      // Update keys if provided
      if (geminiKey !== undefined) {
        envDict['GEMINI_API_KEY'] = geminiKey;
        process.env.GEMINI_API_KEY = geminiKey;
      }
      if (googleSheetId !== undefined) {
        envDict['GOOGLE_SHEET_ID'] = googleSheetId;
        process.env.GOOGLE_SHEET_ID = googleSheetId;
      }
      if (aiProvider !== undefined) {
        envDict['AI_PROVIDER'] = aiProvider;
        process.env.AI_PROVIDER = aiProvider;
      }
      if (ollamaBaseUrl !== undefined) {
        envDict['OLLAMA_BASE_URL'] = ollamaBaseUrl;
        process.env.OLLAMA_BASE_URL = ollamaBaseUrl;
      }
      if (ollamaModel !== undefined) {
        envDict['OLLAMA_MODEL'] = ollamaModel;
        process.env.OLLAMA_MODEL = ollamaModel;
      }
      if (ollamaVisionModel !== undefined) {
        envDict['OLLAMA_VISION_MODEL'] = ollamaVisionModel;
        process.env.OLLAMA_VISION_MODEL = ollamaVisionModel;
      }

      // Write back to .env
      const updatedContent = Object.entries(envDict)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

      fs.writeFileSync(this.envPath, updatedContent + '\n', 'utf8');

      return { message: 'Configuration updated successfully' };
    } catch (e) {
      throw new InternalServerErrorException(`Failed to save configuration: ${e.message}`);
    }
  }
}
