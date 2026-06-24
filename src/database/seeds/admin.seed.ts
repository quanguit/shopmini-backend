import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { User } from 'src/modules/user/entities/user.entity';
import { UserRole } from 'src/modules/user/enums/user-role.enum';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';

async function seed() {
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();

  const repo = ds.getRepository(User);

  const existing = await repo.findOneBy({ email: 'admin@shopmini.com' });
  if (existing) {
    console.log('Admin already exists, skipping.');
    await ds.destroy();
    return;
  }

  const admin = repo.create({
    fullName: 'Admin',
    email: 'admin@shopmini.com',
    password: await bcrypt.hash('Admin@123', 10),
    role: UserRole.ADMIN,
  });

  await repo.save(admin);
  console.log('Admin user created: admin@shopmini.com / Admin@123');
  await ds.destroy();
}

seed().catch(console.error);
