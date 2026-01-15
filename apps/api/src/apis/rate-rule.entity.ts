import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Api } from './api.entity';

export type RateRuleScope = 'api' | 'api_key' | 'user' | 'ip';

@Entity('rate_rules')
@Index(['api_id', 'scope'], { unique: true })
export class RateRule {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint' })
  api_id: number;

  @ManyToOne(() => Api, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'api_id' })
  api: Api;

  @Column({
    type: 'enum',
    enum: ['api', 'api_key', 'user', 'ip'],
  })
  scope: RateRuleScope;

  @Column({ type: 'int' })
  limit_value: number;

  @Column({ type: 'int' })
  interval_seconds: number;

  @Column({ type: 'int', nullable: true })
  burst_limit: number | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;
}
