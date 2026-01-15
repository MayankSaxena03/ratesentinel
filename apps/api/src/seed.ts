import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Tenant } from './tenants/tenant.entity';
import { User } from './users/user.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'ratesentinel',
  entities: [Tenant, User],
});

async function seed() {
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);

  const tenant = await tenantRepo.save({
    name: 'Demo Tenant',
  });

  const passwordHash = await bcrypt.hash('admin123', 10);

  await userRepo.save({
    tenantId: tenant.id,
    email: 'admin@demo.com',
    passwordHash,
    role: 'admin',
  });

  console.log('✅ Seed complete');
  process.exit(0);
}

seed();
