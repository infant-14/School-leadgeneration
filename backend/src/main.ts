import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend requests
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Set standard API endpoint prefix
  app.setGlobalPrefix('api');
  
  // Enable standard native WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));
  
  // Port configuration matching Next.js frontend calls
  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 NestJS Backend server running on http://localhost:${port}`);
}
bootstrap();
