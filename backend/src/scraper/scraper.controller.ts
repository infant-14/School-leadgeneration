import { Controller, Post, Get, Body } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  async triggerScrape(
    @Body('area') area: string,
    @Body('school_type') schoolType: string,
    @Body('limit') limit: number,
  ) {
    // Run scraper asynchronously
    this.scraperService.runScraper(area, schoolType, limit !== undefined ? limit : 0);
    return { message: 'Scrape job initiated successfully' };
  }

  @Get('status')
  async getStatus() {
    return { is_running: this.scraperService.getStatus() };
  }
}
