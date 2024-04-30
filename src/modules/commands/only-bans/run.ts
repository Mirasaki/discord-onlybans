import { ChannelType, ChatInputCommandInteraction, Client, Colors } from 'discord.js';
import { createGuild, getGuild, updateGuild } from '../../../database';
import { GuildSettings } from '../../../types';

export const onlyBansCommandRunFn = async (
  client: Client<true>,
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  const { options, guild } = interaction;
  if (!guild || !guild.available || !interaction.inGuild()) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true,
    });
    return;
  }
  
  const subcommand = options.getSubcommand();

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

  if (subcommand === 'list') {
    if (guildSettings.onlyBans.length === 0) {
      await interaction.reply({
        content: 'There\'s currently no channels in the OnlyBans watchlist.',
        ephemeral: true,
      });
      return;
    }
    const embeds = guildSettings.onlyBans.map((config) => {
      const channel = guild.channels.cache.get(config.channelId);
      return {
        color: Colors.Aqua,
        title: `Channel #${channel?.name ?? 'unknown'}`,
        description: [
          `Logging Channel: ${config.loggingChannelId
            ? guild.channels.cache.get(config.loggingChannelId)?.name ?? 'unknown'
            : 'None'}`,
          `URLs Only: ${config.urlsOnly ? 'Yes' : 'No'}`,
          `Invites Only: ${config.invitesOnly ? 'Yes' : 'No'}`,
          `Initial Message: \`\`\`\n${config.messageTemplates.initial.message}\n\`\`\``,
          `Ban Message Type: ${config.messageTemplates.ban.type}`,
          `Ban Message Delete After: ${config.messageTemplates.ban.deleteAfter ?? 'Never'}`,
          `Ban Message: \`\`\`\n${config.messageTemplates.ban.message}\n\`\`\``,
        ].join('\n'),
      };
    });
    interaction.reply({
      embeds,
      ephemeral: true,
    });
  }
  else if (subcommand === 'add') {
    if (guildSettings.onlyBans.length >= 10) {
      await interaction.reply({
        content: 'You can have up to 10 channels in the OnlyBans watchlist.',
        ephemeral: true,
      });
      return;
    }

    const channel = options.getChannel('channel', true, [ ChannelType.GuildText ]);
    const resolvedChannel = guild.channels.resolve(channel.id);
    if (!resolvedChannel) {
      await interaction.reply({
        content: 'Invalid channel provided.',
        ephemeral: true,
      });
      return;
    }

    const loggingChannel = options.getChannel('logging-channel', false, [ ChannelType.GuildText ]);
    const urlsOnly = options.getBoolean('urls-only') ?? false;
    const invitesOnly = options.getBoolean('invites-only') ?? false;
    const initialMessage = options.getString('initial-message') ?? [
      'Welcome to our OnlyBans Premium channel!',
      '',
      'Please send a message in this channel if you wish to be banned!',
      '*Note: This is **not** a joke, this is protection against accounts that post in all available channels.*',
      '',
      'OnlyBans Subscriber Count: {{count}}',
    ].join('\n');
    const banMessageType = options.getString('ban-message-type') ?? 'dm';
    const banMessageText = options.getString('ban-message-text') ?? 'You have been banned from the server.';
    const banMessageDeleteAfter = options.getInteger('ban-message-delete-after') ?? null;

    guildSettings.onlyBans.push({
      channelId: channel.id,
      loggingChannelId: loggingChannel?.id ?? null,
      urlsOnly,
      invitesOnly,
      ignoreIds: [],
      messageTemplates: {
        initial: { message: initialMessage },
        ban: {
          type: banMessageType as 'dm' | 'channel',
          message: banMessageText,
          deleteAfter: banMessageDeleteAfter,
        }
      },
      messageId: null,
    });
    await updateGuild(guildSettings);

    const msg = await channel.send({
      content: initialMessage.replace('{{count}}', guildSettings.bans.length.toString()),
    });

    const index = guildSettings.onlyBans.findIndex((config) => config.channelId === channel.id);
    guildSettings.onlyBans[index].messageId = msg.id;
    await updateGuild(guildSettings);

    await interaction.reply({
      content: `Added channel ${channel} to the OnlyBans watchlist.`,
      ephemeral: true,
    });
  }
  else if (subcommand === 'remove') {
    const channel = options.getChannel('channel', true);
    const index = guildSettings.onlyBans.findIndex((config) => config.channelId === channel.id);
    if (index === -1) {
      await interaction.reply({
        content: 'This channel is not in the OnlyBans watchlist.',
        ephemeral: true,
      });
      return;
    }

    guildSettings.onlyBans.splice(index, 1);
    await updateGuild(guildSettings);

    await interaction.reply({
      content: `Removed channel ${channel} from the OnlyBans watchlist.`,
      ephemeral: true,
    });
  }

  else if (subcommand === 'edit') {
    const channel = options.getChannel('channel', true);
    const index = guildSettings.onlyBans.findIndex((config) => config.channelId === channel.id);
    const onlyBansConfig = guildSettings.onlyBans[index];
    if (index === -1 || !onlyBansConfig) {
      await interaction.reply({
        content: 'This channel is not in the OnlyBans watchlist.',
        ephemeral: true,
      });
      return;
    }

    const loggingChannel = options.getChannel('logging-channel', false, [ ChannelType.GuildText ]);
    const urlsOnly = options.getBoolean('urls-only');
    const invitesOnly = options.getBoolean('invites-only');
    const initialMessage = options.getString('initial-message');
    const banMessageType = options.getString('ban-message-type');
    const banMessageText = options.getString('ban-message-text');
    const banMessageDeleteAfter = options.getInteger('ban-message-delete-after');

    const nullableString = (value: string | null) => value === null || value === 'none' ? null : value;

    if (loggingChannel !== null) onlyBansConfig.loggingChannelId = loggingChannel.id;
    if (urlsOnly !== null) onlyBansConfig.urlsOnly = urlsOnly;
    if (invitesOnly !== null) onlyBansConfig.invitesOnly = invitesOnly;
    if (initialMessage !== null) onlyBansConfig.messageTemplates.initial.message = nullableString(initialMessage);
    if (banMessageType !== null) onlyBansConfig.messageTemplates.ban.type = banMessageType as 'dm' | 'channel';
    if (banMessageText !== null) onlyBansConfig.messageTemplates.ban.message = nullableString(banMessageText);
    if (banMessageDeleteAfter !== null) onlyBansConfig.messageTemplates.ban.deleteAfter = banMessageDeleteAfter;

    await updateGuild(guildSettings);

    await interaction.reply({
      content: `Updated settings for channel ${channel}.`,
      ephemeral: true,
    });
  }
};