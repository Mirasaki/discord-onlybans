import { SlashCommandBuilder } from 'discord.js';
import { settingsCommandRunFn } from './run';

export const settingsCommand = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure the global settings.')
    .addSubcommand((subcommand) => subcommand
      .setName('list')
      .setDescription('List the current settings.'),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('require-channel-count')
      .setDescription('Set the minimum number of channels required to be in the watchlist.')
      .addIntegerOption((option) => option
        .setName('count')
        .setDescription('The minimum number of channels required.')
        .setRequired(true),
      ),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('confirmation')
      .setDescription('Configure the confirmation settings.')
      .addBooleanOption((option) => option
        .setName('enabled')
        .setDescription('Enable or disable the confirmation requirement.')
        .setRequired(true),
      )
      .addChannelOption((option) => option
        .setName('channel')
        .setDescription('The channel to send the confirmation messages to.')
        .setRequired(false),
      )
      .addRoleOption((option) => option
        .setName('admin-role')
        .setDescription('The role that can confirm bans.')
        .setRequired(false)
      ),
    ),
  run: settingsCommandRunFn,
};