import { MessageEmbed } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';
import { setlogsCommand } from './interactions/commands.js';

export const data = setlogsCommand;

export async function execute(interaction) {
  const { client, guildId, options } = interaction;

  const modLogChannel = options.getChannel('modlog');
  const logsChannel = options.getChannel('logs');
  const moderatorRole = options.getRole('moderator');

  if (!modLogChannel || !logsChannel || !moderatorRole) {
    return interaction.reply({ content: 'Invalid Channel/Role: 404 not found', ephemeral: true });
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
  const embed = new MessageEmbed()
    .setColor('GREEN')
    .setTitle('✿ [UPDATED]')
    .setDescription(
      `**↳** \` [${modLogChannel.name}] \` ➜ Moderator actions.
    **↳** \` [${logsChannel.name}] \` ➜ Logging.
    **↳** \` [${moderatorRole.name}] \` ➜ Moderator Role.`,
    )
    .setTimestamp();

  interaction.editReply({ embeds: [embed], ephemeral: true });
}
