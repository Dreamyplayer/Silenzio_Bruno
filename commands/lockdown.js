import { SlashCommandBuilder } from '@discordjs/builders';
import { Permissions } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lockdown')
  .setDescription('Locks / unlocks a text channel')
  .addStringOption(option =>
    option
      .setName('commands')
      .setDescription('Select lock/unlock to this text channel.')
      .setRequired(true)
      .addChoice('Lock', 'locked')
      .addChoice('unlock', 'unlocked'),
  );

export async function execute(interaction) {
  const cmds = interaction.options.getString('commands');
  const locked = interaction.channel;
  if (cmds === 'locked') {
    locked.permissionOverwrites
      .set(
        [
          {
            id: interaction.guildId,
            deny: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ADD_REACTIONS],
            type: 'role',
          },
        ],
        `Locking ${locked.name} text channel`,
      )
      .catch(console.error);
    await interaction.reply({ content: 'Channel Locked', ephemeral: true });
  } else if (cmds === 'unlocked') {
    locked.permissionOverwrites
      .set(
        [
          {
            id: interaction.guildId,
            allow: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ADD_REACTIONS],
            type: 'role',
          },
        ],
        `Unlocking ${locked.name} text channel`,
      )
      .catch(console.error);
    await interaction.reply({ content: 'Channel Locked', ephemeral: true });
  }
}
