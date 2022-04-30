import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';

export const data = new SlashCommandBuilder()
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

export async function execute(interaction) {
  const { client, guild, user, guildId, options } = interaction;
  const member = options.getUser('user');
  const reason = options.getString('reason');
  const reference = options.getString('reference');

  const bigReason = reason?.length > 3000 ? reason.substring(0, 3000) + '...' : reason;
  const ref = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${reference}`);

  if (ref === undefined && reference !== null) {
    return interaction.reply({ content: '*Invalid Reference ID*', ephemeral: true });
  }
  const unabnMember = await guild.bans.fetch(member).catch(console.error);

  if (!unabnMember) {
    return interaction.reply({ content: 'Could not find member in Guild bans list', ephemeral: true });
  }

  const { modLogChannelID } = await client.bruno.get(`SELECT modLogChannelID FROM guild WHERE guildid = ${guildId}`);

  let data = await client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const increase = data?.caseid ? ++data.caseid : 1;

  await client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${increase}, ${guildId}, 'Unban', '${reason ?? undefined}', ${user.id}, '${user.tag}',
  ${member.id}, '${member.user.tag}', '${reference ?? undefined}')`);

  const modLogs = guild.channels.cache.get(modLogChannelID);
  const owner = guild.ownerId === user.id ? 'Owner' : 'Moderator';

  await interaction.deferReply({ ephemeral: true });
  await wait(3000);

  const embed = new MessageEmbed()
    .setAuthor({
      name: `${user.username} (${owner})`,
      iconURL: user.displayAvatarURL(),
    })
    .setColor('#ed174f')
    .setDescription(
      `**${owner}:** \` ${user.tag} \` [${user.id}]
     **Member:** \` ${member.user.tag} \` [${member.id}]
     **Action:** 'Unban'
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

  await interaction.editReply({ content: `\`[Unban]\`: ${member.user.tag} \`(${member.id})\``, ephemeral: true });
  // await guild.bans.remove(member, reason ?? 'No reason provided').catch(console.error);
}
