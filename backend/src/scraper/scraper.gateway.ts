import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ path: '/api/logs' })
export class ScraperGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeClients = new Set<any>();

  handleConnection(client: any) {
    this.activeClients.add(client);
    try {
      client.send('> Connected to NestJS log stream...');
    } catch (e) {
      // ignore
    }
  }

  handleDisconnect(client: any) {
    this.activeClients.delete(client);
  }

  broadcast(message: string) {
    for (const client of this.activeClients) {
      try {
        client.send(message);
      } catch (err) {
        this.activeClients.delete(client);
      }
    }
  }
}
