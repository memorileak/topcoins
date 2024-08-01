import {WebSocket} from 'ws';
import {Injectable, Logger} from '@nestjs/common';
import {Option, Result} from '@trinance/devkit';

import {PriceTrackerConfig} from './PriceTrackerConfig';

@Injectable()
export class BinanceStreamConsumer {
  private readonly logger = new Logger(BinanceStreamConsumer.name);

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

  setup(): Result<void> {
    return Result.fromExecution(() => {
      const wsClient = new WebSocket(this.priceTrackerConfig.binanceStreamURI);

      wsClient.on('open', () => {
        this.logger.log('WebSocket client connected, subscribing to price events');
        const subscribeMessage = JSON.stringify({
          method: 'SUBSCRIBE',
          params: [this.priceTrackerConfig.binanceStreamName],
          id: this.getIncrementId().unwrapOr(1),
        });
        wsClient.send(subscribeMessage);
      });

      wsClient.on('message', (data: string) => {
        const message = JSON.parse(data);
        this.messageQueue.push(message);
      });

      wsClient.on('error', (err) => {
        this.logger.error(err.message || err, err.stack);
      });

      wsClient.on('close', () => {
        this.logger.log('WebSocket client disconnected, reconnect after 5 seconds');
        this.delaySecs(5).then(() => this.setup());
      });
    });
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
