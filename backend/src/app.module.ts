import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Lead } from './entities/lead.entity';
import { User } from './entities/user.entity';
import { LeadsModule } from './leads/leads.module';
import { ScraperModule } from './scraper/scraper.module';
import { ConfigController } from './config/config.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '.env'),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbType = process.env.DB_TYPE || 'mysql';
        if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
          return {
            type: 'better-sqlite3',
            database: path.resolve(__dirname, '../../../school_leads.db'),
            entities: [Lead, User],
            synchronize: true,
            logging: false,
          };
        }

        if (dbType === 'postgres' || dbType === 'postgresql') {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL || undefined,
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'postgres',
            entities: [Lead, User],
            synchronize: true,
            logging: false,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          };
        }
        
        return {
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 3306,
          username: process.env.DB_USERNAME || 'root',
          password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
          database: process.env.DB_DATABASE || 'school_leads',
          entities: [Lead, User],
          synchronize: true,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature([User]),
    LeadsModule,
    ScraperModule,
  ],
  controllers: [ConfigController, AppController],
  providers: [AppService],
})
export class AppModule {}
