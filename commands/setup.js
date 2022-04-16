import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types/v9';
import { setTimeout as wait } from 'node:timers/promises';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Setup the Roles, channels before begin')
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

  await interaction.deferReply({ ephemeral: true });
  await wait(3000);

  try {
    client.bruno.exec(
      `UPDATE guild SET modlogchannelid = ${modLogChannel.id}, logchannelid = ${logsChannel.id}, modroleid = ${moderatorRole.id}
      WHERE guildid = ${guildId}`,
    );
  } catch (error) {
    client.bruno.exec(
      `INSERT INTO guild (guildid, modlogchannelid, logchannelid, modroleid)
      VALUES (${guildId}, ${modLogChannel.id}, ${logsChannel.id}, ${moderatorRole.id})`,
    );
  }

  interaction.editReply({
    content: `**✿ \` [UPDATED] \`** \n\n**↳** \` [${modLogChannel.name}] \` channel set for Mod actions.
**↳** \` [${logsChannel.name}] \` channel set for logs. \n**↳** \` [${moderatorRole.name}] \` set for moderator Role.`,
    ephemeral: true,
  });
}
