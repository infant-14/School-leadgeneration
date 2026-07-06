import { Controller, Get, Post, Body, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppService } from './app.service';
import { User } from './entities/user.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('auth/signup')
  async signup(@Body() body: any) {
    const { username, password, email, name } = body;
    if (!username || !password) {
      throw new UnauthorizedException('Username and password are required');
    }

    const existing = await this.userRepository.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const user = this.userRepository.create({
      username,
      password, // Stored as plain text for simple local testing setup
      email: email || null,
      name: name || null,
    });

    await this.userRepository.save(user);
    return { success: true, message: 'Signup successful' };
  }

  @Post('auth/login')
  async login(@Body() body: any) {
    const { username, password } = body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin';
    
    // 1. Check default admin configuration fallback
    if (username === adminUser && password === adminPass) {
      return { 
        success: true, 
        token: 'session_token_leadflow_sa', 
        user: { name: 'Silvia Admin', email: 'admin@silvia.agency' } 
      };
    }

    // 2. Check user database records
    const user = await this.userRepository.findOne({ where: { username } });
    if (user && user.password === password) {
      return {
        success: true,
        token: `session_token_${user.id}_${user.username}_${Date.now()}`,
        user: { name: user.name || user.username, email: user.email || '' }
      };
    }

    throw new UnauthorizedException('Invalid username or password');
  }
}
