import { Client, GatewayIntentBits, Routes } from 'discord.js';

import config from '../config.json';
import { GuildSettings } from './types';
import { databaseInitialize, db, updateGuild } from './database';
import { messageCreate } from './modules/listeners';
import { onlyBansCommand, settingsCommand } from './modules/commands';

const commands = [ onlyBansCommand, settingsCommand ];

console.log('OnlyBans is starting up...');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('ready', (c) => {
  console.log(`OnlyBans is ready! Logged in as ${c.user.tag} in ${process.env.NODE_ENV ?? 'development'} mode!`);

  const route = process.env.NODE_ENV === 'production' || !config.guildId
    ? Routes.applicationCommands(config.appId)
    : Routes.applicationGuildCommands(config.appId, config.guildId);
  console.log(`Registering commands at ${route}...`);
  client.rest.put(route, { body: commands.map((command) => command.data.toJSON()) });
  if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode detected, clearing production commands...');
    c.application.commands.cache.forEach((command) => {
      c.rest.delete(Routes.applicationCommand(config.appId, command.id)).then(() => {
        console.log(`Deleted command ${command.name}`);
      });
    });
  }
  
  console.log('Synchronizing guilds...');
  const guilds = db.getCollection<GuildSettings>('guilds');
  c.guilds.cache.forEach(async (guild) => {
    const guildData = guilds.findOne({ guildId: guild.id });
    if (!guildData) {
      console.log(`Adding guild ${guild.name} (${guild.nameAcronym}) to the database...`);
      const doc = guilds.insert({
        guildId: guild.id,
        bans: [],
        onlyBans: [],
        requireChannelCount: 1,
        confirmation: {
          enabled: false,
          channelId: null,
          adminRoleId: null
        },
      });
      if (doc) await updateGuild(doc);
    }
  });

  console.log(`Finished synchronizing ${guilds.count()} guilds!`);
});

client.on('guildCreate', (guild) => {
  console.log(`[GUILD-CREATE] Joined guild ${guild.name} (${guild.nameAcronym})!`);
  const guilds = db.getCollection<GuildSettings>('guilds');
  const guildData = guilds.findOne({ guildId: guild.id });
  if (!guildData) {
    console.log(`Adding guild ${guild.name} (${guild.nameAcronym}) to the database...`);
    guilds.insert({
      guildId: guild.id,
      bans: [],
      onlyBans: [],
      requireChannelCount: 1,
      confirmation: {
        enabled: false,
        channelId: null,
        adminRoleId: null
      },
    });
  }
});

client.on('guildDelete', (guild) => {
  console.log(`[GUILD-DELETE] Left guild ${guild.name} (${guild.nameAcronym})!`);
  const guilds = db.getCollection<GuildSettings>('guilds');
  guilds.findAndRemove({ guildId: guild.id });
});

client.on('messageCreate', (message) => {
  if (!client.isReady()) return;
  messageCreate(client, message);
});

client.on('interactionCreate', async (interaction) => {
  if (!client.isReady()) return;
  if (!interaction.isChatInputCommand()) return;
  const command = commands.find((c) => c.data.name === interaction.commandName);
  if (!command) return;
  command.run(client, interaction);
});

export const main = (): void => {
  databaseInitialize(null);

  client.login(config.token);
  const guilds = db.getCollection<GuildSettings>('guilds');
  console.log(`Loaded ${guilds.count()} guilds from the database.`);

  const allGuilds = guilds.find();
  allGuilds.forEach((guild) => {
    console.log(`Initialized guild ${guild.guildId} with ${guild.onlyBans.length} configured only-ban channels.`);
  });
};

main();