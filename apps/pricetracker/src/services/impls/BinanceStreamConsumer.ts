import {WebSocket} from 'ws';
import {Injectable, Logger} from '@nestjs/common';
import {Option, Result} from '@trinance/devkit';

import {PriceTrackerConfig} from './PriceTrackerConfig';

@Injectable()
export class BinanceStreamConsumer {
  private readonly logger = new Logger(BinanceStreamConsumer.name);

  private wsClient: WebSocket;
  private isWsClientAlive: boolean = false;
  private nextIncrementId: 1;
  private messageQueue: Array<Record<string, any>> = [];

  constructor(private readonly priceTrackerConfig: PriceTrackerConfig) {}

  private getIncrementId(): Result<number> {
    return Result.fromExecution(() => {
      const id = this.nextIncrementId;
      this.nextIncrementId += 1;
      return id;
    });
  }

  setupNewConnection(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      const wsClient = new WebSocket(this.priceTrackerConfig.binanceStreamURI);

      wsClient.on('error', (err) => {
        this.isWsClientAlive = false;
        this.logger.error(err.message || err, err.stack);
      });

      wsClient.on('close', () => {
        this.isWsClientAlive = false;
        this.logger.log('WebSocket client disconnected, should reconnect after several seconds');
      });

      wsClient.on('open', () => {
        wsClient.on('message', (data: string) => {
          const message = JSON.parse(data);
          this.messageQueue.push(message);
        });

        this.logger.log('WebSocket client connected, subscribing to price events...');

        const subscribeMessage = JSON.stringify({
          method: 'SUBSCRIBE',
          params: [this.priceTrackerConfig.binanceStreamName],
          id: this.getIncrementId().unwrapOr(1),
        });

        wsClient.send(subscribeMessage);

        this.isWsClientAlive = true;
      });

      while (!this.isWsClientAlive) {
        await this.delaySecs(0);
      }

      this.wsClient = wsClient;
    });
  }

  terminateConnection(): Promise<Result<void>> {
    return Result.fromExecutionAsync(async () => {
      if (this.wsClient && this.isWsClientAlive) {
        this.wsClient.terminate();
        while (this.isWsClientAlive) {
          await this.delaySecs(0);
        }
      }
    });
  }

  isConnectionAlive(): boolean {
    return this.isWsClientAlive;
  }

  getMessage(): Option<Record<string, any>> {
    const oldestMessage = this.messageQueue.shift();
    return oldestMessage ? Option.some(oldestMessage) : Option.none();
  }

  private delaySecs(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000);
    });
  }
}
