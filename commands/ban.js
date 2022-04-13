import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bans member')
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
  );

export async function execute(interaction) {
  const member = interaction.options.getMember('user');
  const picked = interaction.options.getString('delete_messages');
  const reason = interaction.options.getString('reason');
  const bigReason = reason?.length > 3000 ? reason.substring(0, 3000) + '...' : reason;
  const days = picked === 'dda' ? 0 : picked === '24h' ? 1 : 7;

  if (!member) {
    return interaction.reply({ content: 'User not found', ephemeral: true });
  }
  if (member?.bannable === false) {
    return interaction.reply({
      content: `You don't have the appropriate permissions to ban that user.`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });
  await wait(5000);
  const logChannel = await interaction.client.bruno.get(
    `SELECT modLogChannelID FROM channels WHERE guildid = ${interaction.guild.id}`,
  );

  let data = await interaction.client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${interaction.guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const increase = data?.caseid ? ++data.caseid : 1;

  await interaction.client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, reason, deletemessagedays, moderatorid, targetid)
  VALUES (${increase}, ${interaction.guildId}, 'Ban', '${reason ?? undefined}', ${days}, ${interaction.user.id},
  ${member.id})`);

  const modLogs = interaction.guild.channels.cache.get(logChannel.modLogChannelID);

  const owner = interaction.guild.ownerId === interaction.user.id ? 'Owner' : 'Moderator';
  const embed = new MessageEmbed()
    .setAuthor({
      name: `${interaction.user.username} (${owner})`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setColor('#ed174f')
    .setDescription(
      `**${owner}:** \` ${interaction.user.tag} \` [${interaction.user.id}]
       **Member:** \` ${member.user.tag} \` [${member.id}]
       **Action:** Ban
       ${reason ? `**Reason:** ${bigReason}` : ''}
       ${days > 0 ? `**Deleted Messages:** ${days} Day(s)` : ''}`,
    )
    .setFooter({ text: `Case ${increase}` })
    .setTimestamp();
  await modLogs
    ?.send({ embeds: [embed] })
    .then(message =>
      interaction.client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${increase}`),
    );

  // Updating Bans count to this banned user
  const bans = await interaction.client.history.get(`SELECT bans FROM history WHERE userid = '${member.id}'`);

  if (bans === undefined) {
    await interaction.client.history.exec(`INSERT INTO history (userid, bans) VALUES ('${member.id}', 1)`);
  } else {
    await interaction.client.history.exec(`UPDATE history SET bans = bans + 1 WHERE userid = ${member.id}`);
  }

  await interaction.editReply({ content: `► **\`[BANNED]\`** ${member.user.tag} \`(${member.id})\`` });
  // await member.ban({ days: picked === 'dda' ? 0 : picked === '24h' ? 1 : 7, reason });
}
