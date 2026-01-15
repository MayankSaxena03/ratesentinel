import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Api } from '../apis/api.entity';

export enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
}

@Entity('api_keys')
@Index(['keyHash'], { unique: true })
export class ApiKey {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Api, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'api_id' })
  api: Api;

  @Column({ name: 'key_hash', type: 'char', length: 64 })
  keyHash: string;

  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
