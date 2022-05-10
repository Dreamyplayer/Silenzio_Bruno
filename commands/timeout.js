import { MessageEmbed } from 'discord.js';
import ms from 'ms';
import { setTimeout as wait } from 'node:timers/promises';
import { timeoutCommand } from './interactions/commands.js';

export const data = timeoutCommand;

export async function execute(interaction) {
  const { client, guild, user, guildId, options } = interaction;

  const member = options.getMember('user');
  const selected = options.getString('options');
  const duration = options.getInteger('duration');
  const reason = options.getString('reason');
  const reference = options.getInteger('reference');

  const bigReason = reason?.length > 1000 ? reason.substring(0, 1000) + '...' : reason;
  const milliseconds = ms(`${duration}${selected}`);
  const msToTime = ms(milliseconds, { long: true });

  const ref = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${reference}`);

  if (!member) {
    return interaction.reply({ content: 'User not found', ephemeral: true });
  }
  if (milliseconds > ms('28d')) {
    return interaction.reply({ content: 'Duration must be less than 28 days', ephemeral: true });
  }
  if (member.isCommunicationDisabled()) {
    return interaction.reply({ content: 'User has Already Timed Out', ephemeral: true });
  }
  if (member?.manageable === false) {
    return interaction.reply({
      content: `You don't have the appropriate permissions to timeout that user.`,
      ephemeral: true,
    });
  }
  if (ref === undefined && reference !== null) {
    return interaction.reply({ content: '*Invalid Reference ID*', ephemeral: true });
  }

  const logs = await client.bruno.get(`SELECT modLogChannelID FROM guild WHERE guildid = ${guildId}`);
  const modLogs = guild.channels.cache.get(logs?.modLogChannelID);

  let data = await client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const increase = data?.caseid ? ++data.caseid : 1;

  await client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, actionexpiration, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${increase}, ${guildId}, 'Timeout', ${milliseconds}, '${reason ?? undefined}', ${user.id},'${user.tag}',
  ${member.id}, '${member.user.tag}', '${reference ?? undefined}')`);

  // Updating Bans count to this banned user
  const timeouts = await client.history.get(`SELECT timeouts FROM history WHERE userid = '${member.id}'`);

  if (timeouts === undefined) {
    await client.history.exec(`INSERT INTO history (userid, timeouts) VALUES ('${member.id}', 1)`);
  } else {
    await client.history.exec(`UPDATE history SET timeouts = timeouts + 1 WHERE userid = ${member.id}`);
  }

  const owner = guild.ownerId === user.id ? 'Owner' : 'Moderator';
  await interaction.deferReply({ ephemeral: true });
  await wait(4000);
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
    ) // Add reference if it exists
    .setFooter({ text: `Case ${increase}` })
    .setTimestamp();
  await modLogs
    ?.send({ embeds: [embed] })
    .then(message => client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${increase}`));

  interaction.editReply({
    content: `► **\`[Timeout]:\`** \`${member.user.tag}\` [${member.id}] \n↳ **\`(${msToTime})\`**`,
  });

  member.timeout(milliseconds, reason ?? `Timeout by ${client.user.username}`).catch(console.error);

  // Usage + points
  const usage = await client.history.get(`SELECT caseAction, total FROM usage WHERE caseAction = 'Timeout'`);
  if (usage?.caseAction === undefined) {
    await client.history.exec(`INSERT INTO usage (caseAction, total) VALUES ('Timeout', 1)`);
  } else {
    await client.history.exec(`UPDATE usage SET total = total + 1 WHERE caseAction = 'Timeout'`);
  }
  // Points
  const points = await client.history.get(
    `SELECT Timeout FROM counts WHERE guildid = '${guildId}' AND userid = '${user.id}'`,
  );
  console.log(points?.[`Timeout`], points);
  if (points?.[`Timeout`] === undefined) {
    await client.history.exec(
      `INSERT INTO counts (guildid, userid, userTag, Timeout) VALUES (${guildId}, '${user.id}', '${user.tag}', 1)`,
    );
  } else if (points?.[`Timeout`] === null) {
    await client.history.exec(`UPDATE counts SET Timeout = 1 WHERE userid = '${user.id}' AND guildid = ${guildId}`);
  } else {
    await client.history.exec(
      `UPDATE counts SET Timeout = Timeout + 1 WHERE userid = '${user.id}' AND guildid = ${guildId}`,
    );
  }
}
