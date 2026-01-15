import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'active' })
  status: 'active' | 'suspended';

  @Column({ name: 'kill_switch', default: false })
  killSwitch: boolean;
}
