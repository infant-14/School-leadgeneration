import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { ScraperGateway } from './scraper.gateway';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private isScraping = false;
  private readonly rootDir = path.resolve(__dirname, '../../..');

  constructor(
    private readonly scraperGateway: ScraperGateway,
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
  ) {}

  getStatus(): boolean {
    return this.isScraping;
  }

  async runScraper(area: string, type: string, limit: number, userId: number | null): Promise<void> {
    if (this.isScraping) {
      throw new BadRequestException('A scraping job is already running');
    }

    this.isScraping = true;
    let existingFile: string | null = null;

    try {
      this.scraperGateway.broadcast(`> Launching lead scraper for '${type}' in '${area}'...`);

      const pythonExe = path.join(this.rootDir, 'venv/Scripts/python.exe');
      const mainScript = path.join(this.rootDir, 'backend_python', 'main.py');

      // Fetch existing leads and write to JSON file for Python script to skip
      const existingLeads = await this.leadsRepository.find({ where: { userId: userId === null ? IsNull() : userId } });
      const existingNames = existingLeads.map(l => l.school_name.toLowerCase().trim());
      const tempFileName = `existing_leads_${userId || 0}_${Date.now()}.json`;
      existingFile = path.join(this.rootDir, 'backend_python', tempFileName);
      fs.writeFileSync(existingFile, JSON.stringify(existingNames, null, 2));

      this.logger.log(`Spawning scraper process: ${pythonExe} ${mainScript} --area "${area}" --type "${type}" --limit ${limit} --existing-file "${existingFile}"`);

      // Spawn the python scraper pipeline
      const child = spawn(
        `"${pythonExe}"`, 
        ['-W', 'ignore', '-u', `"${mainScript}"`, '--area', `"${area}"`, '--type', `"${type}"`, '--limit', `${limit}`, '--existing-file', `"${existingFile}"`], 
        {
          cwd: this.rootDir,
          shell: true,
          env: { 
            ...process.env, 
            PYTHONUNBUFFERED: '1', 
            PYTHONWARNINGS: 'ignore',
            PYTHONIOENCODING: 'utf-8',
            PYTHONUTF8: '1'
          }
        }
      );

      let isAccumulatingJson = false;
      let jsonAccumulator = '';

      // stdout line-by-line reading with chunk/buffer accumulation support for large JSON objects
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        
        if (isAccumulatingJson) {
          jsonAccumulator += chunk;
          return;
        }
        
        const jsonStartIndex = chunk.indexOf('DATABASE_JSON:');
        if (jsonStartIndex !== -1) {
          const logPart = chunk.substring(0, jsonStartIndex).trim();
          if (logPart) {
            logPart.split('\n').forEach(line => {
              const trimmed = line.trim();
              if (trimmed) {
                this.logger.log(trimmed);
                this.scraperGateway.broadcast(trimmed);
              }
            });
          }
          isAccumulatingJson = true;
          jsonAccumulator = chunk.substring(jsonStartIndex + 'DATABASE_JSON:'.length);
        } else {
          chunk.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed) {
              this.logger.log(trimmed);
              this.scraperGateway.broadcast(trimmed);
            }
          });
        }
      });

      // stderr line-by-line reading
      child.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          output.split('\n').forEach(line => {
            const trimmed = line.trim();
            this.logger.error(trimmed);
            this.scraperGateway.broadcast(`[stderr] ${trimmed}`);
          });
        }
      });

      // Handle spawn error (e.g. process cannot be started)
      child.on('error', (err) => {
        this.logger.error(`Failed to start scraper process: ${err.message}`);
        this.scraperGateway.broadcast(`ERROR: Failed to start scraper process: ${err.message}`);
        this.isScraping = false;
        this.cleanupTempFile(existingFile);
      });

      child.on('close', async (code) => {
        this.isScraping = false;
        this.cleanupTempFile(existingFile);

        if (code === 0) {
          const jsonString = jsonAccumulator.trim();
          if (jsonString) {
            try {
              const leads = JSON.parse(jsonString);
              this.scraperGateway.broadcast(`> Scraper finished! Syncing ${leads.length} leads to database...`);
              const batchId = Date.now(); // Generate a unique batch timestamp
              for (const item of leads) {
                // Check if existing lead belonging to this user
                const existing = await this.leadsRepository.findOne({ 
                  where: { school_name: item.school_name, userId: userId === null ? IsNull() : userId } 
                });
                if (existing) {
                  // update details (preserve stage/status)
                  Object.assign(existing, {
                    website_url: item.website_url || '',
                    contact_number: item.contact_number || '',
                    area_name: item.area_name || '',
                    search_area: area || '',
                    address: item.address || '',
                    pincode: item.pincode || '',
                    institution_type: item.institution_type || 'Matriculation',
                    appearance: item.appearance || 'Redesign',
                    remarks: item.remarks || '',
                    atmosphere: item.atmosphere || 'Good',
                    social_media: item.social_media || 'Inactive',
                    social_media_urls: item.social_media_urls || '',
                    google_rating: item.google_rating || '',
                    photo_url: item.photo_url || '',
                    batch_id: batchId, // Update batch ID to represent the newest scrape session
                  });
                  await this.leadsRepository.save(existing);
                } else {
                  // create new lead
                  const newLead = this.leadsRepository.create({
                    school_name: item.school_name,
                    userId,
                    website_url: item.website_url || '',
                    contact_number: item.contact_number || '',
                    area_name: item.area_name || '',
                    search_area: area || '',
                    address: item.address || '',
                    pincode: item.pincode || '',
                    institution_type: item.institution_type || 'Matriculation',
                    appearance: item.appearance || 'Redesign',
                    remarks: item.remarks || '',
                    atmosphere: item.atmosphere || 'Good',
                    social_media: item.social_media || 'Inactive',
                    social_media_urls: item.social_media_urls || '',
                    google_rating: item.google_rating || '',
                    photo_url: item.photo_url || '',
                    status: 'New Lead',
                    batch_id: batchId, // Set batch ID to current session
                  });
                  await this.leadsRepository.save(newLead);
                }
              }
              this.scraperGateway.broadcast('SUCCESS: Database sync complete!');
            } catch (err) {
              this.logger.error(`Failed to save leads to database: ${err.message}`);
              this.scraperGateway.broadcast(`ERROR: Failed to save leads to database: ${err.message}`);
            }
          } else {
            this.scraperGateway.broadcast('> Scraper finished successfully! (No database updates found)');
          }
        } else {
          this.scraperGateway.broadcast(`ERROR: Scraper process closed with non-zero exit code: ${code}`);
        }
        this.logger.log(`Scraper process exited with code ${code}`);
      });
    } catch (err) {
      this.isScraping = false;
      this.cleanupTempFile(existingFile);
      this.logger.error(`Scraper setup failed: ${err.message}`, err.stack);
      this.scraperGateway.broadcast(`ERROR: Scraper setup failed: ${err.message}`);
      throw err;
    }
  }

  private cleanupTempFile(filePath: string | null) {
    if (!filePath) return;
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      this.logger.error(`Failed to delete temp existing file: ${err.message}`);
    }
  }
}
