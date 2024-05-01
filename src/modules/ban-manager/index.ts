import { 
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Colors,
  ComponentType,
  EmbedBuilder,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  Message
} from 'discord.js';

import { updateGuild } from '../../database';
import { GuildSettings, OnlyBansConfig } from '../../types';
import { MS_IN_DAY } from '../../constants';

export const banForSpam = async (
  _client: Client<true>,
  message: Message<true>,
  guildSettings: GuildSettings,
  onlyBansCfg: OnlyBansConfig,
) => {
  const { id, guild, member, channel } = message;
  const debugTag = `[ONLY-BANS-${id}]`;

  message.delete().catch((err) => {
    console.error(`${debugTag} Error encountered while deleting message:`, err);
  });

  if (!member) {
    console.log(`${debugTag} Missing member object, skipping!`);
    return;
  }
  if (!member?.bannable) {
    console.log(`${debugTag} User is not bannable, please check permissions!`);
    return;
  }

  // Let's create the ban object first
  const requiresMultipleChannels = guildSettings.requireChannelCount !== null && guildSettings.requireChannelCount > 1;
  guildSettings.bans.push({
    banned: !requiresMultipleChannels,
    userId: message.author.id,
    channelId: message.channelId,
    date: new Date().toISOString(),
    message: message.content,
  });

  // Check if multiple channels are required
  let banned = false;
  if (requiresMultipleChannels) {
    const userSpam = guildSettings.bans.filter((b) =>
      b.userId === message.author.id
      // && !b.banned
      // && new Date(b.date) > new Date(Date.now() - MS_IN_DAY)
    );
    if (userSpam.length >= (guildSettings.requireChannelCount as number)) {
      console.log(`${debugTag} User has sent ${userSpam.length} spam messages, banning user...`);
      banned = true;
      await promptConfirmation(id, guild, guildSettings, member, channel, message);
      await notifyBan(id, onlyBansCfg, member, channel);
      await guild.members.ban(message.author.id, {
        reason: `Only-bans triggered in multiple channels: ${
          userSpam.map((b) => `#${guild.channels.cache.get(b.channelId)?.name ?? 'unknown'}`).join(', ') ?? 'unknown'
        }`,
        deleteMessageSeconds: 604800
      });
    }
    else {
      console.log([
        `${debugTag} User has sent ${userSpam.length} spam messages,`,
        `but requires ${guildSettings.requireChannelCount} to ban.`,
      ].join(' '));
    }
  }

  else {
    await promptConfirmation(id, guild, guildSettings, member, channel, message);
    banned = true;
    console.log(`${debugTag} User spammed in a single channel, banning user...`);
    await notifyBan(id, onlyBansCfg, member, channel);
    await guild.members.ban(message.author.id, {
      reason: `Only-bans triggered in #${channel.name}`,
      deleteMessageSeconds: 604800
    });
  }

  if (banned && onlyBansCfg.loggingChannelId) {
    const loggingChannel = guild.channels.cache.get(onlyBansCfg.loggingChannelId);
    if (loggingChannel?.isTextBased()) {
      loggingChannel.send({
        content: [
          `User ${member.user.username} (\`${member.user.id}\`) has been OnlyBanned in ${channel}!`,
          `Message: ||\`\`\`\n${
            message.content.length > 1000
              ? `${message.content.substring(0, 1000)}...`
              : message.content
          }\n\`\`\`||`,
        ].join('\n'),
      }).catch((err) => {
        console.error(`${debugTag} Error encountered while sending logging message:`, err);
      });
    }
  }

  // Update sticky message
  if (banned && onlyBansCfg.messageId && onlyBansCfg.messageTemplates.initial.message) {
    const stickyMessage = await channel.messages.fetch(onlyBansCfg.messageId);
    const count = [
      ...new Set(guildSettings.bans.filter((e) => e.channelId === message.channelId).map((e) => e.userId))
    ].length.toString();
    if (stickyMessage) {
      stickyMessage.edit({
        content: onlyBansCfg.messageTemplates.initial.message.replaceAll(
          '{{count}}',
          count
        ),
      }).catch((err) => {
        console.error(`${debugTag} Error encountered while updating sticky message:`, err);
      });
    }
    else {
      const msg = await channel.send({
        content: onlyBansCfg.messageTemplates.initial.message.replaceAll(
          '{{count}}',
          count
        ),
      }).catch((err) => {
        console.error(`${debugTag} Error encountered while sending sticky message:`, err);
      });
      if (msg) {
        onlyBansCfg.messageId = msg.id;
      }
    }
  }

  // Update the guild settings, and ban#isBanned references
  guildSettings.onlyBans = guildSettings.onlyBans.map((c) => {
    if (c.channelId === message.channelId) {
      c = onlyBansCfg;
    }
    return c;
  });
  guildSettings.bans = guildSettings.bans.map((b) => {
    if (b.userId === message.author.id) {
      b.banned = true;
    }
    return b;
  });
  await updateGuild(guildSettings);
};

export const notifyBan = async (
  id: string,
  onlyBansCfg: OnlyBansConfig,
  member: GuildMember,
  channel: GuildTextBasedChannel,
) => {
  const debugTag = `[ONLY-BANS-${id}]`;

  // Send the ban message
  if (onlyBansCfg.messageTemplates.ban.message) {
    const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('@notify-ban-server')
        .setStyle(ButtonStyle.Secondary)
        .setLabel(`Server: ${member.guild.name}`)
        .setDisabled(true)
    );

    let notificationMsg: Message | null;
    if (onlyBansCfg.messageTemplates.ban.type === 'dm') {
      notificationMsg = await member.send({
        content: onlyBansCfg.messageTemplates.ban.message,
        components: [components],
      }).catch((err) => {
        console.error(`${debugTag} Error encountered while sending DM:`, err);
        return null;
      });
    }
    else if (onlyBansCfg.messageTemplates.ban.type === 'channel') {
      notificationMsg = await channel.send({
        content: onlyBansCfg.messageTemplates.ban.message,
        components: [components],
      }).catch((err) => {
        console.error(`${debugTag} Error encountered while sending channel message:`, err);
        return null;
      });
    }

    if (onlyBansCfg.messageTemplates.ban.deleteAfter) {
      setTimeout(() => {
        notificationMsg?.delete().catch((err) => {
          console.error(`${debugTag} Error encountered while deleting ban notification message:`, err);
        });
      }, onlyBansCfg.messageTemplates.ban.deleteAfter * 1000);
    }
  }
};

export const promptConfirmation = async (
  id: string,
  guild: Guild,
  guildSettings: GuildSettings,
  member: GuildMember,
  channel: GuildTextBasedChannel,
  message: Message,
) => {
  const debugTag = `[ONLY-BANS-${id}]`;

  // Prompt for confirmation if enabled
  if (guildSettings.confirmation.enabled && guildSettings.confirmation.channelId) {
    const confirmationChannel = guild.channels.cache.get(guildSettings.confirmation.channelId);
    if (confirmationChannel?.isTextBased()) {
      const prompt = await confirmationChannel.send({
        content: guildSettings.confirmation.adminRoleId ? [
          `<@&${guildSettings.confirmation.adminRoleId}> User ${member}`,
          `(\`${member.user.id}\`) has triggered OnlyBans in ${channel}!`
        ].join(' ') : [
          `User ${member.user.username} (\`${member.user.id}\`)`,
          `has triggered OnlyBans in ${channel}!`
        ].join(' '),
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle('Ban Confirmation')
            .setDescription([
              `User **__${member.user.username}__** (\`${member.user.id}\`) has triggered OnlyBans in ${channel}!`,
              `**Message:** ||\`\`\`\n${
                message.content.length > 1000
                  ? `${message.content.substring(0, 1000)}...`
                  : message.content
              }\n\`\`\`||`,
            ].join('\n')),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`@confirm-ban-${id}`)
              .setStyle(ButtonStyle.Danger)
              .setLabel('Ban User'),
            new ButtonBuilder()
              .setCustomId(`@cancel-ban-${id}`)
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Cancel'),
          )
        ]
      });
  
      const collected = await prompt?.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: MS_IN_DAY * 7,
        filter: (interaction) => !guildSettings.confirmation.adminRoleId || interaction.member.roles.cache.some(
          (r) => guildSettings.confirmation.adminRoleId === r.id
        ),
      }).catch((err) => {
        console.error(`${debugTag} Error encountered while awaiting confirmation:`, err);
        return null;
      });
  
      if (!collected) {
        console.log(`${debugTag} Confirmation timed out, skipping ban...`);
        if (prompt.deletable) prompt.delete().catch((err) => {
          console.error(`${debugTag} Error encountered while deleting confirmation message:`, err);
        });
        return;
      }
  
      if (collected.customId === `@confirm-ban-${id}`) {
        console.log(`${debugTag} Confirmation received, continuing to ban user...`);
      }
      else {
        console.log(`${debugTag} Confirmation declined, cancelling ban...`);
        return;
      }

      if (prompt.deletable) prompt.delete().catch((err) => {
        console.error(`${debugTag} Error encountered while deleting confirmation message:`, err);
      });

      return collected;
    }
  }
};