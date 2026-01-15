import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Api } from './api.entity';
import { CreateApiDto, UpdateApiDto } from './dto/api.dto';

@Injectable()
export class ApiService {
  constructor(
    @InjectRepository(Api)
    private readonly apiRepo: Repository<Api>,
  ) {}

  async create(tenantId: number, dto: CreateApiDto): Promise<Api> {
    const existing = await this.apiRepo.findOne({
      where: {
        tenantId,
        name: dto.name,
        environment: dto.environment,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'API with same name and environment already exists for this tenant',
      );
    }

    const api = this.apiRepo.create({
      ...dto,
      tenantId,
      isActive: true,
    });

    return this.apiRepo.save(api);
  }

  async findAll(tenantId: number): Promise<Api[]> {
    return this.apiRepo.find({
      where: { tenantId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: number, apiId: number): Promise<Api> {
    const api = await this.apiRepo.findOne({
      where: { id: apiId, tenantId, isActive: true },
    });

    if (!api) {
      throw new NotFoundException('API not found');
    }

    return api;
  }

  async update(
    tenantId: number,
    apiId: number,
    dto: UpdateApiDto,
  ): Promise<Api> {
    const api = await this.findOne(tenantId, apiId);

    const nextName = dto.name ?? api.name;
    const nextEnv = dto.environment ?? api.environment;

    const duplicate = await this.apiRepo.findOne({
      where: {
        tenantId,
        name: nextName,
        environment: nextEnv,
        isActive: true,
      },
    });

    if (duplicate && duplicate.id !== api.id) {
      throw new ConflictException(
        'Another API with same name and environment already exists for this tenant',
      );
    }

    Object.assign(api, dto);
    return this.apiRepo.save(api);
  }

  async setApiActiveStatus(
    tenantId: number,
    apiId: number,
    isActive: boolean,
  ): Promise<Api> {
    const api = await this.apiRepo.findOne({
      where: { id: apiId, tenantId },
    });

    if (!api) {
      throw new NotFoundException('API not found');
    }

    api.isActive = isActive;
    return this.apiRepo.save(api);
  }

  async remove(tenantId: number, apiId: number): Promise<void> {
    const api = await this.findOne(tenantId, apiId);
    api.isActive = false;
    await this.apiRepo.save(api);
  }
}
