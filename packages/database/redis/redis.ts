import { RedisClientType } from 'redis';
import { createClient } from 'redis';

class Redis {
  private _client: RedisClientType | null;
  constructor() {
    this._client = null;
  }

  get client(): RedisClientType | null {
    return this._client;
  }

  async connect() {
    this._client = createClient({
      socket: {
        host: 'localhost',
        port: 6379,
        reconnectStrategy: (retries: number, RedisError) => {
          if (retries < 3) {
            return 1;
          }
          throw RedisError;
        },
      },
    });
    await this._client.connect();
  }
}

export default Redis;
