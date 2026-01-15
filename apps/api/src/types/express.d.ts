import { Api } from '../apis/api.entity';
import { ApiKey } from '../api-keys/api-key.entity';

declare global {
  namespace Express {
    interface Request {
      api?: Api;
      apiKey?: ApiKey;
    }
  }
}

export {};
