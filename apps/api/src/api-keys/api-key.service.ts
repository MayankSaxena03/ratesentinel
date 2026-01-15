import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, ApiKeyStatus } from './api-key.entity';
import { Api } from '../apis/api.entity';
import { generatePlaintextApiKey, hashApiKey } from './api-key.util';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,

    @InjectRepository(Api)
    private readonly apiRepo: Repository<Api>,
  ) {}

  async generateKey(
    tenantId: number,
    apiId: number,
  ): Promise<{ plaintextKey: string }> {
    const api = await this.apiRepo.findOne({
      where: { id: apiId, tenantId, isActive: true },
    });

    if (!api) {
      throw new NotFoundException('API not found');
    }

    const plaintextKey = generatePlaintextApiKey();
    const keyHash = hashApiKey(plaintextKey);

    const apiKey = this.apiKeyRepo.create({
      api,
      keyHash,
    });

    await this.apiKeyRepo.save(apiKey);

    return { plaintextKey };
  }

  async revokeKey(
    tenantId: number,
    apiId: number,
    keyId: number,
  ): Promise<void> {
    const key = await this.apiKeyRepo.findOne({
      where: {
        id: keyId,
        api: { id: apiId, tenantId },
        status: ApiKeyStatus.ACTIVE,
      },
      relations: ['api'],
    });

    if (!key || Number(key.api.tenantId) !== Number(tenantId)) {
      throw new NotFoundException('API key not found');
    }

    key.status = ApiKeyStatus.REVOKED;
    await this.apiKeyRepo.save(key);
  }

  async listKeys(
    tenantId: number,
    apiId: number,
  ): Promise<
    {
      id: number;
      status: ApiKeyStatus;
      createdAt: Date;
    }[]
  > {
    const keys = await this.apiKeyRepo.find({
      where: {
        api: { id: apiId, tenantId },
        status: ApiKeyStatus.ACTIVE,
      },
      relations: ['api'],
    });

    return keys.map((k) => ({
      id: k.id,
      status: k.status,
      createdAt: k.createdAt,
    }));
  }

  async findByPlaintextKey(plaintextKey: string) {
    const keyHash = hashApiKey(plaintextKey);

    const apiKey = await this.apiKeyRepo.findOne({
      where: {
        keyHash,
        status: ApiKeyStatus.ACTIVE,
      },
      relations: ['api'],
    });

    if (!apiKey) {
      return null;
    }

    if (!apiKey.api.isActive) {
      return null;
    }

    return apiKey;
  }

  async rotate(
    tenantId: number,
    apiId: number,
    keyId: number,
  ): Promise<{ plaintextKey: string }> {
    const key = await this.apiKeyRepo.findOne({
      where: {
        id: keyId,
        status: ApiKeyStatus.ACTIVE,
      },
      relations: ['api'],
    });

    if (
      !key ||
      Number(key.api.id) !== Number(apiId) ||
      Number(key.api.tenantId) !== Number(tenantId)
    ) {
      throw new NotFoundException('API key not found');
    }

    key.status = ApiKeyStatus.REVOKED;
    await this.apiKeyRepo.save(key);

    const plaintextKey = generatePlaintextApiKey();
    const keyHash = hashApiKey(plaintextKey);

    const newKey = this.apiKeyRepo.create({
      api: key.api,
      keyHash,
      status: ApiKeyStatus.ACTIVE,
    });

    await this.apiKeyRepo.save(newKey);

    return { plaintextKey };
  }

  async rotateAll(
    tenantId: number,
    apiId: number,
  ): Promise<{ plaintextKey: string }> {
    const api = await this.apiRepo.findOne({
      where: { id: apiId, tenantId, isActive: true },
    });

    if (!api) {
      throw new NotFoundException('API not found');
    }

    await this.apiKeyRepo.update(
      {
        api: { id: api.id },
        status: ApiKeyStatus.ACTIVE,
      },
      {
        status: ApiKeyStatus.REVOKED,
      },
    );

    const plaintextKey = generatePlaintextApiKey();
    const keyHash = hashApiKey(plaintextKey);

    const newKey = this.apiKeyRepo.create({
      api,
      keyHash,
      status: ApiKeyStatus.ACTIVE,
    });

    await this.apiKeyRepo.save(newKey);

    return { plaintextKey };
  }
}
