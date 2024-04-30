import { Client, Message } from 'discord.js';
import { createGuild, getGuild } from '../../database';
import { GuildSettings } from '../../types';
import { banForSpam } from '../ban-manager';

export const messageCreate = async (client: Client<true>, message: Message) => {
  if (message.author.bot || !message.guild) return;

  const { id, guild } = message;
  if (!guild.available) {
    console.log(`[ONLY-BANS] Guild ${guild.name} (${guild.nameAcronym}) is not available!`);
    return;
  }

  if (!message.inGuild()) {
    console.log(`[ONLY-BANS-${id}] Missing member object, skipping!`);
    return;
  }

  let guildSettings: GuildSettings | null = getGuild(guild.id);
  if (!guildSettings) {
    guildSettings = createGuild({
      guildId: guild.id,
      bans: [],
      onlyBans: [],
      requireChannelCount: 1,
      confirmation: {
        enabled: false,
        channelId: null,
        adminRoleId: null,
      },
    });
  }

  const isOnlyBansChannel = guildSettings.onlyBans.find((c) => c.channelId === message.channelId);
  if (!isOnlyBansChannel) return;
  
  const debugTag = `[ONLY-BANS-${id}]`;
  const onlyBansCfg = isOnlyBansChannel;
  console.log(`${debugTag} Message is in a channel that's being watched for spam messages!`);

  // Require URL if configured
  if (onlyBansCfg.urlsOnly && (
    !message.content.includes('http://')
    || !message.content.includes('https://')
    || !message.content.includes('discord.gg')
    || !message.content.includes('discord.com')
  )) {
    console.log(`${debugTag} Message does NOT contain a URL, skipping!`);
    return;
  }

  // Require invite link if configured
  if (onlyBansCfg.invitesOnly && (
    !message.content.includes('discord.gg')
    || !message.content.includes('discord.com')
  )) {
    console.log(`${debugTag} Message does NOT contain an invite link, skipping!`);
    return;
  }

  // Check ignored ids
  if (onlyBansCfg.ignoreIds.includes(message.author.id)) {
    console.log(`${debugTag} Message author is ignored, skipping!`);
    return;
  }
  else if (message.member && message.member.roles.cache.some((r) => onlyBansCfg.ignoreIds.includes(r.id))) {
    console.log(`${debugTag} Message author role is ignored, skipping!`);
    return;
  }

  // Note: From here, the message is considered spam - and should be banned (or marked as spam)
  console.log(`${debugTag} Message is spam!`);
  banForSpam(client, message, guildSettings, onlyBansCfg);
};