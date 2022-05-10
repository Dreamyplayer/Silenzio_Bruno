import { Permissions } from 'discord.js';
import { lockdownCommand } from './interactions/commands.js';

export const data = lockdownCommand;

export async function execute(interaction) {
  const cmds = interaction.options.getString('commands');
  const locked = interaction.options.getChannel('channel');
  const reason = interaction.options.getString('reason');

  if (cmds === 'locked') {
    if (!locked.permissionsFor(interaction.guildId).has(Permissions.FLAGS.SEND_MESSAGES))
      return await interaction.reply({ content: `${locked} seems already locked.`, ephemeral: true });
    locked.permissionOverwrites
      .set(
        [
          {
            id: interaction.guildId,
            deny: [Permissions.FLAGS.SEND_MESSAGES],
            type: 'role',
          },
        ],
        `Locking a text channel`,
      )
      .catch(console.error);
    await interaction.reply({ content: `\\🔒 Channel Locked`, ephemeral: true });
    await locked.send(
      `${reason ? `✚ \`[ 🔒 CHANNEL LOCKED ]\` \n↳ Reason: *${reason}*` : `✚ \`[ 🔒 CHANNEL LOCKED ]\``}`,
    );
  } else if (cmds === 'unlocked') {
    locked.permissionOverwrites
      .set(
        [
          {
            id: interaction.guildId,
            allow: [Permissions.FLAGS.SEND_MESSAGES],
            type: 'role',
          },
        ],
        `Unlocking a text channel`,
      )
      .catch(console.error);
    await interaction.reply({ content: '\\🔓 Channel Unlocked', ephemeral: true });
    await locked.send(
      `${reason ? `✚ \`[ 🔓 CHANNEL UNLOCKED ]\` \n↳ Reason: *${reason}*` : `✚ \`[ 🔓 CHANNEL UNLOCKED ]\``}`,
    );
  }
}
