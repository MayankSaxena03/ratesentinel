import { Controller } from '@nestjs/common';
import { WorkerHealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: WorkerHealthService) {}
}
