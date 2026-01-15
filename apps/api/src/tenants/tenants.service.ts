import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  create(dto: CreateTenantDto) {
    const tenant = this.tenantRepo.create(dto);
    return this.tenantRepo.save(tenant);
  }

  findAll() {
    return this.tenantRepo.find();
  }

  async findById(id: number) {
    return this.tenantRepo.findOne({ where: { id } });
  }

  async getByIdOrFail(id: number) {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async update(id: number, dto: UpdateTenantDto) {
    const tenant = await this.getByIdOrFail(id);
    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }

  async updateStatus(id: number, status: 'active' | 'suspended') {
    const tenant = await this.getByIdOrFail(id);
    tenant.status = status;
    return this.tenantRepo.save(tenant);
  }

  async updateKillSwitch(id: number, killSwitch: boolean) {
    const tenant = await this.getByIdOrFail(id);
    tenant.killSwitch = killSwitch;
    return this.tenantRepo.save(tenant);
  }

  async createTenantWithAdmin(input: {
    tenant: CreateTenantDto;
    adminEmail: string;
    adminPassword: string;
  }) {
    return this.dataSource.transaction(async (manager) => {
      const tenant = manager.create(Tenant, {
        ...input.tenant,
        status: 'active',
        killSwitch: false,
      });

      await manager.save(tenant);

      const passwordHash = await bcrypt.hash(input.adminPassword, 10);

      const adminUser = manager.create(User, {
        tenantId: tenant.id,
        email: input.adminEmail,
        passwordHash,
        role: 'admin',
        status: 'active',
      });

      await manager.save(adminUser);

      return {
        tenant,
        adminUser,
      };
    });
  }
}
