import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum RequestDecision {
  ALLOWED = 'allowed',
  THROTTLED = 'throttled',
  BLOCKED = 'blocked',
}

@Entity({ name: 'requests_log' })
export class RequestsLogEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  tenant_id: number;

  @Column({ type: 'bigint' })
  api_id: number;

  @Column({ type: 'bigint', nullable: true })
  api_key_id: number | null;

  @Column({ type: 'bigint', nullable: true })
  user_id: number | null;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar', length: 512 })
  path: string;

  @Column({ type: 'int' })
  status_code: number;

  @Column({ type: 'enum', enum: RequestDecision })
  decision: RequestDecision;

  @Column({ type: 'int', nullable: true })
  latency_ms: number | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  snapshot_s3_url: string | null;

  @CreateDateColumn()
  created_at: Date;
}
