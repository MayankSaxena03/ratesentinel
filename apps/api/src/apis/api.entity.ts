import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ApiEnvironment {
  DEV = 'dev',
  STAGING = 'staging',
  PROD = 'prod',
}

@Entity('apis')
@Index(['tenantId', 'name', 'environment'], { unique: true })
export class Api {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId: number;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: ApiEnvironment,
  })
  environment: ApiEnvironment;

  @Column({ name: 'base_url', length: 512 })
  baseUrl: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
