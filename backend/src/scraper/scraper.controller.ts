import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { ScraperService } from './scraper.service';

function getUserIdFromToken(headers: any): number | null {
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (token === 'session_token_leadflow_sa') {
    return 0; // Default admin
  }
  if (token.startsWith('session_token_')) {
    const parts = token.split('_');
    const userId = Number(parts[2]);
    return isNaN(userId) ? null : userId;
  }
  return null;
}

@Controller('scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  async triggerScrape(
    @Body('area') area: string,
    @Body('school_type') schoolType: string,
    @Body('limit') limit: number,
    @Headers() headers: any,
  ) {
    const userId = getUserIdFromToken(headers);
    // Run scraper asynchronously
    this.scraperService.runScraper(area, schoolType, limit !== undefined ? limit : 0, userId);
    return { message: 'Scrape job initiated successfully' };
  }

  @Get('status')
  async getStatus() {
    return { is_running: this.scraperService.getStatus() };
  }
}
