export type OnlyBansConfig = {
  /** 
   * The channel id of the channel to watch for messages. If someone
   * sends a message in this channel, the bot will check if it's a
   * spam message and if it is, it will ban the user.
   */
  channelId: string;
  /**
   * The channel id where the bot should log the bans that are made.
   */
  loggingChannelId: string | null;
  /**
   * When checking a message, should it only be marked as spam if it
   * contains an (Discord) invite link?
   */
  invitesOnly: boolean;
  /**
   * When checking a message, should it only be marked as spam if it
   * contains a URL?
   */
  urlsOnly: boolean;
  /**
   * Ids of resources that should be ignored when checking messages.
   * This could be users or roles that should be ignored/not be banned.
   */
  ignoreIds: string[];
  /**
   * Configure the message templates that are used when sending messages
   */
  messageTemplates: {
    /**
     * The message sent in the channel that's being watched
     * for spam messages.
     */
    initial: {
      message: string | null;
    }
    /**
     * The message that should be sent when a user is banned.
     */
    ban: {
      type: 'dm' | 'channel';
      message: string | null;
      deleteAfter: number | null;
    }
  };

  // Internal
  messageId: string | null;
}

export type GuildSettings = {
  guildId: string;
  onlyBans: OnlyBansConfig[];
  requireChannelCount: number | null;
  /**
   * A list of all the bans that have been made in this guild.
   */
  bans: {
    /**
     * The user id of the banned user.
     */
    userId: string;
    /**
     * The message that was sent by the user that got them banned.
     */
    message: string;
    /**
     * The date when the user was banned.
     */
    date: string;
    /**
     * The channel id where the user was banned.
     */
    channelId: string;
    /**
     * If the user has been banned, can be false if multiple
     * channels are required to ban the user.
     */
    banned: boolean;
  }[];
  /**
   * Configure confirmation for bans. If enabled, the bot will
   * require confirmation from an admin before banning a user.
   */
  confirmation: {
    enabled: boolean;
    channelId: string | null;
    adminRoleId: string | null;
  }
};