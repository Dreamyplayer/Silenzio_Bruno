import { setTimeout as wait } from 'node:timers/promises';
import { setupCommand } from './interactions/commands.js';

export const data = setupCommand;

export async function execute(interaction) {
  const { client, guildId, options } = interaction;

  const modLogChannel = options.getChannel('modlog');
  const logsChannel = options.getChannel('logs');
  const moderatorRole = options.getRole('moderator');

  if (!modLogChannel) {
    return interaction.reply({ content: 'Modlog channel not found', ephemeral: true });
  }
  if (!logsChannel) {
    return interaction.reply({ content: 'Logs channel not found', ephemeral: true });
  }
  if (!moderatorRole) {
    return interaction.reply({ content: 'Moderator role not found', ephemeral: true });
  }

  const brunoGuild = await client.bruno.get(
    `SELECT logchannelId, modLogChannelID, modRoleID FROM guild WHERE guildid = '${guildId}'`,
  );

  if (brunoGuild === undefined) {
    client.bruno.exec(
      `INSERT INTO guild (guildid, modlogchannelid, logchannelid, modroleid)
      VALUES (${guildId}, ${modLogChannel.id}, ${logsChannel.id}, ${moderatorRole.id})`,
    );
  } else {
    client.bruno.exec(
      `UPDATE guild SET modlogchannelid = ${modLogChannel.id}, logchannelid = ${logsChannel.id}, modroleid = ${moderatorRole.id}
      WHERE guildid = ${guildId}`,
    );
  }

  await interaction.deferReply({ ephemeral: true });
  await wait(3000);
  interaction.editReply({
    content: `**✿ \` [UPDATED] \`**
    **↳** \` [${modLogChannel.name}] \` channel set for Mod actions.
    **↳** \` [${logsChannel.name}] \` channel set for logs.
    **↳** \` [${moderatorRole.name}] \` set for moderator Role.`,
  });
}
