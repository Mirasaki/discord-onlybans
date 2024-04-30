import { ChatInputCommandInteraction, Client, Colors, EmbedBuilder } from 'discord.js';
import { createGuild, getGuild, updateGuild } from '../../../database';
import { GuildSettings } from '../../../types';

export const settingsCommandRunFn = async (
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
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Aqua)
          .setTitle('Settings')
          .setDescription([
            `Require Channel Count: ${guildSettings.requireChannelCount ?? 'None'}`,
            `Confirmation Enabled: ${guildSettings.confirmation.enabled ? 'Yes' : 'No'}`,
            `Confirmation Channel: ${guildSettings.confirmation.channelId
              ? guild.channels.cache.get(guildSettings.confirmation.channelId)?.name ?? 'unknown'
              : 'None'}`,
            `Confirmation Admin Role IDs: ${
              guildSettings.confirmation.adminRoleId
                ? guild.roles.cache.get(guildSettings.confirmation.adminRoleId)?.name ?? 'unknown'
                : 'None'
            }`,
          ].join('\n')),
      ],
      ephemeral: true,
    });
  }

  else if (subcommand === 'require-channel-count') {
    const count = options.getInteger('count', true) ?? 1;
    guildSettings.requireChannelCount = count;
    await updateGuild(guildSettings);
    await interaction.reply({
      content: `Require Channel Count has been set to ${count}.`,
      ephemeral: true,
    });
  }

  else if (subcommand === 'confirmation') {
    const enabled = options.getBoolean('enabled', true) ?? false;
    const channelId = options.getChannel('channel', true)?.id ?? null;
    const adminRoleId = options.getRole('admin-role', true) ?? null;
    guildSettings.confirmation = {
      enabled,
      channelId,
      adminRoleId: adminRoleId?.id ?? null,
    };
    await updateGuild(guildSettings);
    await interaction.reply({
      content: 'Confirmation settings have been updated.',
      ephemeral: true,
    });
  }
};