import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types/v9';

export const BanCommand = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bans member')
  .setDefaultPermission(false)
  .addStringOption(option =>
    option
      .setName('commands')
      .setDescription('Select a command to execute')
      .setRequired(true)
      .addChoice('Ban', 'ban')
      .addChoice('softBan', 'softban'),
  )
  .addUserOption(option => option.setName('user').setDescription('The member to ban').setRequired(true))
  .addStringOption(option =>
    option
      .setName('delete_messages')
      .setDescription('How much of their recent messages to delete')
      .setRequired(true)
      .addChoices(
        [
          [`Don't Delete Any`, 'dda'],
          ['Previous 24 Hours', '24h'],
          ['Previous 7 Days', '7d'],
        ],
        true,
      ),
  )
  .addStringOption(option =>
    option.setName('reason').setDescription('The Reason for banning, if any').setRequired(false),
  )
  .addIntegerOption(option =>
    option.setName('reference').setDescription('The Reference for banning, if any').setRequired(false).setMinValue(1),
  );

export const kickCommand = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kicks a Member')
  .setDefaultPermission(false)
  .addUserOption(option => option.setName('user').setDescription('The member to kick').setRequired(true))
  .addStringOption(option =>
    option.setName('reason').setDescription('The Reason for Kicking, if any').setRequired(false),
  )
  .addIntegerOption(option =>
    option.setName('reference').setDescription('The Reference for Kicking, if any').setRequired(false).setMinValue(1),
  );

export const lockdownCommand = new SlashCommandBuilder()
  .setName('lockdown')
  .setDescription('Locks / unlocks a text channel')
  .setDefaultPermission(false)
  .addStringOption(option =>
    option
      .setName('commands')
      .setDescription('Select a text channel to lock/unlock.')
      .setRequired(true)
      .addChoice('Lock', 'locked')
      .addChoice('unlock', 'unlocked'),
  )
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Select Channel to lock/unlock.')
      .setRequired(true)
      .addChannelType(ChannelType.GuildText),
  )
  .addStringOption(option => option.setName('reason').setDescription('Reason for locking/unlocking.'));

export const restrictCommand = new SlashCommandBuilder()
  .setName('restrict')
  .setDescription('Restrict a member of this guild/server.')
  .setDefaultPermission(false)
  .addUserOption(option => option.setName('user').setDescription('The member to restrict').setRequired(true))
  .addStringOption(option =>
    option
      .setName('commands')
      .setDescription('Select a action to restrict.')
      .setRequired(true)
      .addChoice('Embed', 'embed')
      .addChoice('Emoji', 'emoji')
      .addChoice('React', 'react'),
  )
  .addStringOption(option =>
    option
      .setName('options')
      .setDescription('How long to timeout the member for')
      .setRequired(true)
      .addChoices(
        [
          ['seconds', 's'],
          ['minutes', 'm'],
          ['hours', 'h'],
          ['days', 'd'],
          ['weeks', 'w'],
        ],
        true,
      ),
  )
  .addIntegerOption(option =>
    option.setName('duration').setDescription('How long to timeout the member for').setRequired(true),
  )
  .addStringOption(option =>
    option.setName('reason').setDescription('The reason for the restriction, If any').setRequired(false),
  )
  .addStringOption(option =>
    option.setName('reference').setDescription('The reference for the restriction, If any').setRequired(false),
  );

export const setupCommand = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Setup the Roles, channels, Prefix before you begin')
  .setDefaultPermission(false)
  .addChannelOption(option =>
    option
      .setName('modlog')
      .setDescription('The modlog channel')
      .setRequired(true)
      .addChannelType(ChannelType.GuildText),
  )
  .addChannelOption(option =>
    option.setName('logs').setDescription('Logging channel').setRequired(true).addChannelType(ChannelType.GuildText),
  )
  .addRoleOption(option => option.setName('moderator').setDescription('Moderator role').setRequired(true));

export const timeoutCommand = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription(`Members can't chat, reply, react, connect, or use stage channels during timeout.`)
  .setDefaultPermission(false)
  .addUserOption(option => option.setName('user').setDescription('The member to timeout').setRequired(true))
  .addStringOption(option =>
    option
      .setName('options')
      .setDescription('How long to timeout the member for')
      .setRequired(true)
      .addChoices(
        [
          ['seconds', 's'],
          ['minutes', 'm'],
          ['hours', 'h'],
          ['days', 'd'],
          ['weeks', 'w'],
        ],
        true,
      ),
  )
  .addIntegerOption(option =>
    option.setName('duration').setDescription('How long to timeout the member for').setRequired(true),
  )
  .addStringOption(option =>
    option.setName('reason').setDescription('The reason for timing them out, if any').setRequired(false),
  )
  .addIntegerOption(option =>
    option.setName('reference').setDescription('The Reference for banning, if any').setRequired(false).setMinValue(1),
  );

export const unbanCommand = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Unbans member')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription(`The member to unban, insert ID if user doesn't show in list`)
      .setRequired(true),
  )
  .addStringOption(option =>
    option.setName('reason').setDescription('The reason for unbanning the member').setRequired(false),
  )
  .addStringOption(option =>
    option.setName('reference').setDescription('The reference for the unban').setRequired(false),
  );

export const updateCommand = new SlashCommandBuilder()
  .setName('update')
  .setDescription('Updates Case Reason/Reference.')
  .addIntegerOption(option => option.setName('caseid').setDescription('The Case ID').setRequired(true).setMinValue(1))
  .addStringOption(option =>
    option.setName('reason').setDescription('The Reason for the Case, If any').setRequired(false),
  )
  .addIntegerOption(option =>
    option.setName('reference').setDescription('The Reference for the Case, If any').setRequired(false).setMinValue(1),
  );

export const warnCommand = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Warns a user')
  .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
  .addStringOption(option =>
    option.setName('reason').setDescription('The Reason for banning, if any').setRequired(false),
  )
  .addIntegerOption(option =>
    option.setName('reference').setDescription('The Reference for banning, if any').setRequired(false).setMinValue(1),
  );

export const podiumCommand = new SlashCommandBuilder()
  .setName('podium')
  .setDescription('A scoreboard showing the names and current scores of the leading competitors');

export const reportCommand = new SlashCommandBuilder()
  .setName('report')
  .setDescription('Report a user for DM ads or spam')
  .addUserOption(option =>
    option.setName('user').setDescription('The member to report [Mention | ID]').setRequired(true),
  )
  .addStringOption(option =>
    option.setName('proof').setDescription('Proof Screenshot* & Reason, If any').setRequired(true),
  );
