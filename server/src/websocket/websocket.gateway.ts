import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_SOCKET_PROD_URL
        : 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('status', { connected: true });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('audio-stream')
  handleAudioStream(client: Socket, audioChunk: ArrayBuffer) {
    console.log(`Received audio chunk: ${audioChunk.byteLength} bytes`);
    client.emit('transcription', {
      text: `Received ${audioChunk.byteLength} bytes`,
    });
  }
}
