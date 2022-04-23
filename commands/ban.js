import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bans member')
  .setDefaultPermission(false)
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

export async function execute(interaction) {
  const { client, guild, user, guildId, options } = interaction;

  const member = options.getMember('user');
  const picked = options.getString('delete_messages');
  const reason = options.getString('reason');
  const reference = options.getInteger('reference');

  const ref = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${reference}`);

  const bigReason = reason?.length > 3000 ? reason.substring(0, 3000) + '...' : reason;
  const days = picked === 'dda' ? 0 : picked === '24h' ? 1 : 7;

  if (!member) {
    return interaction.reply({ content: '\\☕ *❝ User not found ❞*', ephemeral: true });
  }
  if (member?.bannable === false) {
    return interaction.reply({
      content: `\\☕ *❝ You don't have the appropriate permissions to ban that user ❞*`,
      ephemeral: true,
    });
  }

  if (ref === undefined && reference !== null) {
    return interaction.reply({ content: '*Invalid Reference ID*', ephemeral: true });
  }

  const { modLogChannelID } = await client.bruno.get(`SELECT modLogChannelID FROM guild WHERE guildid = ${guildId}`);

  let data = await client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const increase = data?.caseid ? ++data.caseid : 1;

  await client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, reason, deletemessagedays, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${increase}, ${guildId}, 'Ban', '${reason ?? undefined}', ${days}, ${user.id}, '${user.tag}',
  ${member.id}, '${member.user.tag}', '${reference ?? undefined}')`);

  const modLogs = guild.channels.cache.get(modLogChannelID);
  const owner = guild.ownerId === user.id ? 'Owner' : 'Moderator';

  const embed = new MessageEmbed()
    .setAuthor({
      name: `${user.username} (${owner})`,
      iconURL: user.displayAvatarURL(),
    })
    .setColor('#ed174f')
    .setDescription(
      `**${owner}:** \` ${user.tag} \` [${user.id}]
       **Member:** \` ${member.user.tag} \` [${member.id}]
       **Action:** Ban
       ${reason ? `**Reason:** ${bigReason}` : ''}
       ${
         reference
           ? `**Reference:** [#${reference}](https://discord.com/channels/${guildId}/${modLogs.id}/${ref?.logMessageId})`
           : ''
       }`,
    )
    .setFooter({ text: `Case ${increase}` })
    .setTimestamp();
  await modLogs
    ?.send({ embeds: [embed] })
    .then(message => client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${increase}`));

  // Updating Bans count to this banned user
  const bans = await client.history.get(`SELECT bans FROM history WHERE userid = '${member.id}'`);

  if (bans === undefined) {
    await client.history.exec(`INSERT INTO history (userid, bans) VALUES ('${member.id}', 1)`);
  } else {
    await client.history.exec(`UPDATE history SET bans = bans + 1 WHERE userid = ${member.id}`);
  }

  // await member.ban({ days: picked === 'dda' ? 0 : picked === '24h' ? 1 : 7, reason });

  await interaction.deferReply({ ephemeral: true });
  await wait(4000);
  await interaction.editReply({ content: `► **\`[BANNED]\`** ${member.user.tag} \`(${member.id})\`` });
}
