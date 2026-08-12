import { Sequelize } from 'sequelize';
import { Config } from './config';
import path from 'path';

let sequelize;

if (Config.DATABASE_URL.startsWith('sqlite:')) {
  let storagePath;
  if (process.env.VERCEL === '1' || process.env.NETLIFY === 'true') {
    storagePath = '/tmp/nutrition_agent.db';
  } else {
    storagePath = path.join(process.cwd(), 'instance', 'nutrition_agent.db');
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
} else {
  sequelize = new Sequelize(Config.DATABASE_URL, {
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
}

let isSynced = false;
export async function syncDatabase() {
  if (!isSynced) {
    try {
      await sequelize.sync({ alter: false, force: false });
      isSynced = true;
      console.log('Database synced successfully.');
    } catch (e) {
      console.error('Database sync error:', e);
    }
  }
}

export default sequelize;
