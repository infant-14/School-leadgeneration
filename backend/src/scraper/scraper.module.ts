import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from '../entities/lead.entity';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ScraperGateway } from './scraper.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Lead])],
  controllers: [ScraperController],
  providers: [ScraperService, ScraperGateway],
  exports: [ScraperService],
})
export class ScraperModule {}
