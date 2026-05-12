import { config as dotenvConfig } from 'dotenv';
import { registerAs } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.development.env' });

export const typeormConfig: DataSourceOptions = {
  type: 'postgres',

  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: { rejectUnauthorized: false },

  dropSchema: true,
  synchronize: true,

  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
};

export default registerAs('typeorm', () => typeormConfig);

export const connectionSource = new DataSource(typeormConfig);
