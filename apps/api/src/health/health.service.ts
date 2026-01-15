import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getLiveness() {
    return {
      service: 'ratesentinel-api',
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  getReadiness() {
    return {
      ready: true,
      checks: ['config-loaded'],
      timestamp: new Date().toISOString(),
    };
  }
}
