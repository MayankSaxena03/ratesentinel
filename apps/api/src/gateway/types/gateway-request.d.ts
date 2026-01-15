import { Api } from '../../apis/api.entity';
import { ApiKey } from '../../api-keys/api-key.entity';

declare module 'express-serve-static-core' {
  interface Request {
    api?: Api;
    apiKey?: ApiKey;
  }
}
