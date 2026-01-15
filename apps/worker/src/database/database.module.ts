import { Module, OnModuleInit } from '@nestjs/common';
import { WorkerDataSource } from './data-source';

@Module({})
export class DatabaseModule implements OnModuleInit {
  async onModuleInit() {
    if (!WorkerDataSource.isInitialized) {
      await WorkerDataSource.initialize();
    }
  }
}
