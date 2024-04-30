import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { onlyBansCommandRunFn } from './run';

export const onlyBansCommand = {
  data: new SlashCommandBuilder()
    .setName('only-bans')
    .setDescription('Configure the OnlyBans channels and settings.')
    .addSubcommand((subcommand) => subcommand
      .setName('add')
      .setDescription('Add a channel to the OnlyBans watchlist.')
      .addChannelOption((option) => option
        .setName('channel')
        .setDescription('The channel to add to the watchlist.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText),
      )
      .addChannelOption((option) => option
        .setName('logging-channel')
        .setDescription('The channel to log the bans in.')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText),
      )
      .addBooleanOption((option) => option
        .setName('urls-only')
        .setDescription('Only trigger on messages with URLs.'),
      )
      .addBooleanOption((option) => option
        .setName('invites-only')
        .setDescription('Only trigger on messages with invite links.'),
      )
      .addStringOption((option) => option
        .setName('initial-message')
        .setDescription('The message to send in the channel that is being watched. Supports {{count}} placeholder.'),
      )
      .addStringOption((option) => option
        .setName('ban-message-type')
        .setDescription('The type of message to send when a user is banned.')
        .addChoices({
          name: 'DM',
          value: 'dm',
        }, {
          name: 'Channel',
          value: 'channel',
        }),
      )
      .addStringOption((option) => option
        .setName('ban-message-text')
        .setDescription('The message to send when a user is banned.'),
      )
      .addIntegerOption((option) => option
        .setName('ban-message-delete-after')
        .setDescription('The time in seconds to delete the message after.'),
      ),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('remove')
      .setDescription('Remove a channel from the OnlyBans watchlist.')
      .addChannelOption((option) => option
        .setName('channel')
        .setDescription('The channel to remove from the watchlist.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
      ),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('list')
      .setDescription('List all the channels that are being watched for spam messages.'),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('edit')
      .setDescription('Edit the settings of a channel in the OnlyBans watchlist.')
      .addChannelOption((option) => option
        .setName('channel')
        .setDescription('The channel to edit the settings of.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText),
      )
      .addChannelOption((option) => option
        .setName('logging-channel')
        .setDescription('The channel to log the bans in.')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText),
      )
      .addBooleanOption((option) => option
        .setName('urls-only')
        .setDescription('Only trigger on messages with URLs.'),
      )
      .addBooleanOption((option) => option
        .setName('invites-only')
        .setDescription('Only trigger on messages with invite links.'),
      )
      // [DEV] - Needs select menu integration
      // .addUserOption((option) => option
      //   .setName('ignored-users')
      //   .setDescription('A list of users to ignore.'),
      // )
      // .addRoleOption((option) => option
      //   .setName('ignored-roles')
      //   .setDescription('A list of roles to ignore.'),
      // )
      .addStringOption((option) => option
        .setName('initial-message')
        .setDescription('The message to send when a user triggers the filter, supports {{count}} placeholder.'),
      )
      .addStringOption((option) => option
        .setName('ban-message-type')
        .setDescription('The type of message to send when a user is banned.')
        .addChoices({
          name: 'DM',
          value: 'dm',
        }, {
          name: 'Channel',
          value: 'channel',
        }),
      )
      .addStringOption((option) => option
        .setName('ban-message-text')
        .setDescription('The message to send when a user is banned.'),
      )
      .addIntegerOption((option) => option
        .setName('ban-message-delete-after')
        .setDescription('The time in seconds to delete the message after.'),
      )
    ),
  run: onlyBansCommandRunFn
};