import Loki from 'lokijs';
import { GuildSettings } from './types';

export const fsAdapter = new Loki.LokiFsAdapter();

export const databaseInitialize = (err: Error | null) => {
  if (err) {
    console.error('Error encountered while loading database from disk persistence:');
    console.error(err);
    return;
  }

  const guilds = db.getCollection<GuildSettings>('guilds');
  if (guilds === null) {
    db.addCollection('guilds', { unique: ['guildId'] });
  }

  postDatabaseInitialize();
};

export const postDatabaseInitialize = () => {
  console.log('Finished loading database from disk persistence!');
};

export const db = new Loki('db.json', {
  adapter: fsAdapter,
  env: 'NODEJS',
  autoload: true,
  autosave: true,
  autosaveInterval: 4000,
  autoloadCallback: databaseInitialize,
});

export const getGuild = (guildId: string) => {
  const guilds = db.getCollection<GuildSettings>('guilds');
  return guilds.findOne({ guildId });
};

export const createGuild = (data: GuildSettings) => {
  const guilds = db.getCollection<GuildSettings>('guilds');
  guilds.insert(data);
  return data;
};

export const updateGuild = async (data: GuildSettings) => {
  const guilds = db.getCollection<GuildSettings>('guilds');
  guilds.update(data);
  await promiseSaveDatabase();
  return data;
};

export const deleteGuild = (guildId: string) => {
  const guilds = db.getCollection<GuildSettings>('guilds');
  guilds.findAndRemove({ guildId });
};

export const saveDatabase = () => {
  db.saveDatabase((err) => {
    if (err) {
      console.error('Error encountered while saving database to disk persistence:');
      console.error(err);
      return;
    }

    console.log('Finished saving database to disk persistence!');
  });
};

export const promiseSaveDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    db.saveDatabase((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};