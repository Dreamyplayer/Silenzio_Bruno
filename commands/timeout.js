import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import ms from 'ms';
import { setTimeout as wait } from 'node:timers/promises';

export const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription(`Members can't chat, reply, react, connect, or use stage channels during timeout.`)
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
  .addStringOption(option => option.setName('reason').setDescription('The reason for timing them out, if any'));

export async function execute(interaction) {
  const { client, guild, user, guildId, options } = interaction;

  const member = options.getMember('user');
  const selected = options.getString('options');
  const duration = options.getInteger('duration');
  const reason = options.getString('reason');

  const bigReason = reason?.length > 3000 ? reason.substring(0, 3000) + '...' : reason;
  const milliseconds = ms(`${duration}${selected}`);
  const msToTime = ms(milliseconds, { long: true });

  if (!member) {
    return interaction.reply({ content: 'User not found', ephemeral: true });
  }
  if (member?.manageable === false) {
    return interaction.reply({
      content: `You don't have the appropriate permissions to timeout that user.`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });
  await wait(4000);
  const { modLogChannelID } = await client.bruno.get(`SELECT modLogChannelID FROM channels WHERE guildid = ${guildId}`);
  const modLogs = guild.channels.cache.get(modLogChannelID);

  let data = await client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const increase = data?.caseid ? ++data.caseid : 1;

  await client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, actionexpiration, reason, moderatorid, targetid)
  VALUES (${increase}, ${guildId}, 'Timeout', ${milliseconds}, '${reason ?? undefined}', ${user.id},
  ${member.id})`);

  const owner = guild.ownerId === user.id ? 'Owner' : 'Moderator';
  const embed = new MessageEmbed()
    .setAuthor({
      name: `${user.username} (${owner})`,
      iconURL: user.displayAvatarURL(),
    })
    .setColor('#ff0000')
    .setDescription(
      `**${owner}:** \` ${user.tag} \` [${user.id}]
       **Member:** \` ${member.user.tag} \` [${member.id}]
       **Action:** Timeout
       **Action Expiration:** \` ${msToTime} \`
       ${reason ? `**Reason:** ${bigReason}` : ''}`,
    )
    .setFooter({ text: `Case ${increase}` })
    .setTimestamp();
  await modLogs
    ?.send({ embeds: [embed] })
    .then(message => client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${increase}`));

  // Timeout End
  let outData = await client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const outIncrease = outData?.caseid ? ++outData.caseid : 1;

  await client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, actionexpiration, reason, moderatorid, targetid)
  VALUES (${outIncrease}, ${guildId}, 'TimeoutEnd', ${milliseconds}, '${reason ?? undefined}', ${user.id},
  ${member.id})`);

  const messageid = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${increase}`);
  setTimeout(async () => {
    const timeoutEnd = new MessageEmbed()
      .setAuthor({
        name: `${client.user.username} (Bot)`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setColor('#ff0000')
      .setDescription(
        `**Bot:** \` ${client.user.tag} \` [${client.user.id}]
       **Member:** \` ${member.user.tag} \` [${member.id}]
       **Action:** TimeoutEnd
       **Reason:** Timeout expired based on duration
       **Reference:** [#${increase}](https://discord.com/channels/${guildId}/${modLogs.id}/${messageid.logMessageId})`,
      )
      .setFooter({ text: `Case ${outIncrease}` })
      .setTimestamp();
    await modLogs?.send({ embeds: [timeoutEnd] });
  }, milliseconds);

  // Updating Bans count to this banned user
  const timeouts = await client.history.get(`SELECT timeouts FROM history WHERE userid = '${member.id}'`);

  if (timeouts === undefined) {
    await client.history.exec(`INSERT INTO history (userid, timeouts) VALUES ('${member.id}', 1)`);
  } else {
    await client.history.exec(`UPDATE history SET timeouts = timeouts + 1 WHERE userid = ${member.id}`);
  }

  interaction.editReply({
    content: `► **\`[Timeout]\`** \`${member.user.tag}\` [${member.id}] \n↳ **\`(${msToTime})\`**`,
  });

  member.timeout(milliseconds, reason ?? 'They deserved it').catch(console.error);
}
