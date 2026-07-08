import { Controller, Post, Get, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ScraperController.name);

  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  async triggerScrape(
    @Body('area') area: string,
    @Body('school_type') schoolType: string,
    @Body('limit') limit: number,
    @Headers() headers: any,
  ) {
    const userId = getUserIdFromToken(headers);

    // Check status synchronously first
    if (this.scraperService.getStatus()) {
      throw new BadRequestException('A scraping job is already running');
    }

    // Run scraper asynchronously and handle any errors in the background
    this.scraperService.runScraper(area, schoolType, limit !== undefined ? limit : 0, userId).catch(err => {
      this.logger.error(`Error in scraper background process: ${err.message}`, err.stack);
    });

    return { message: 'Scrape job initiated successfully' };
  }

  @Get('status')
  async getStatus() {
    return { is_running: this.scraperService.getStatus() };
  }
}
