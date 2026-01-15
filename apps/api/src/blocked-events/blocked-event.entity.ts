import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'blocked_events' })
export class BlockedEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  tenant_id: number;

  @Column({ type: 'bigint', nullable: true })
  api_id: number | null;

  @Column({
    type: 'enum',
    enum: ['ip', 'api_key', 'user', 'global'],
  })
  block_type: 'ip' | 'api_key' | 'user' | 'global';

  @Column({ type: 'varchar', length: 255 })
  identifier: string;

  @Column({ type: 'varchar', length: 512 })
  reason: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  unblocked_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
