import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(tenantId: number, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      tenantId,
      email: dto.email,
      passwordHash,
      role: dto.role,
      status: 'active',
    });

    return this.userRepo.save(user);
  }

  async findByIdForTenant(userId: number, tenantId: number) {
    return this.userRepo.findOne({
      where: { id: userId, tenantId },
    });
  }

  findAll(tenantId: number) {
    return this.userRepo.find({ where: { tenantId } });
  }

  async update(tenantId: number, userId: number, dto: UpdateUserDto) {
    const user = await this.findByIdForTenant(userId, tenantId);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async updateRole(
    tenantId: number,
    userId: number,
    role: 'admin' | 'developer' | 'viewer',
  ) {
    const user = await this.findByIdForTenant(userId, tenantId);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    user.role = role;
    return this.userRepo.save(user);
  }

  async updateStatus(
    tenantId: number,
    userId: number,
    status: 'active' | 'disabled',
  ) {
    const user = await this.findByIdForTenant(userId, tenantId);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    user.status = status;
    return this.userRepo.save(user);
  }
}
