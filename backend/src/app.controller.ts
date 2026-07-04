import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('auth/login')
  login(@Body() body: any) {
    const { username, password } = body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin';
    
    if (username === adminUser && password === adminPass) {
      return { 
        success: true, 
        token: 'session_token_leadflow_sa', 
        user: { name: 'Silvia Admin', email: 'admin@silvia.agency' } 
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }
}
