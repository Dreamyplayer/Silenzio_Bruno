import { MessageEmbed } from 'discord.js';
import ms from 'ms';

export const name = 'guildMemberUpdate';
export async function execute(oldMember, newMember) {
  const auditLogs = await oldMember.guild.fetchAuditLogs({ limit: 10, type: 24 });
  const logs = auditLogs.entries.find(log => {
    return (
      (log.target.id === newMember.id && log.changes?.some(c => c.key === 'communication_disabled_until')) ?? false
    );
  });

  if (!logs?.changes) {
    return;
  }

  const { modLogChannelID } = await oldMember.client.bruno.get(
    `SELECT modLogChannelID FROM guild WHERE guildid = ${oldMember.guild.id}`,
  );
  const modLogs = oldMember.guild.channels.cache.get(modLogChannelID);

  let data = await oldMember.client.cases.get(
    `SELECT * FROM cases WHERE guildid = ${oldMember.guild.id} AND targetid = ${oldMember.id} AND caseaction = 'Timeout' ORDER BY caseId DESC LIMIT 1;`,
  );

  const timeoutChange = logs.changes.find(c => c.key === 'communication_disabled_until');

  // Manual timeout
  const timeoutEnded = Boolean(timeoutChange.old && !timeoutChange.new);

  // Bruno Timeout
  const brunoTimeout =
    (logs.reason === data.reason) === undefined
      ? data.reason
      : `Timeout by ${oldMember.client.user.username}` && Boolean(timeoutChange.old && timeoutChange.new);

  if (!timeoutChange) {
    return;
  }

  if (timeoutEnded) {
    // Timeout End
    let outData = await oldMember.client.cases.get(
      `SELECT caseId FROM cases WHERE guildid = ${oldMember.guild.id} ORDER BY caseId DESC LIMIT 1;`,
    );

    const outIncrease = outData?.caseid ? ++outData.caseid : 1;

    await oldMember.client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${outIncrease}, ${oldMember.guild.id}, 'TimeoutEnd', 'Timeout expired based on duration', ${logs.executor.id},'${logs.executor.tag}',
  ${oldMember.id}, '${oldMember.user.tag}', '${data.caseid}')`);

    const timeoutEnd = new MessageEmbed()
      .setAuthor({
        name: `${logs.executor.username} (Moderator)`,
        iconURL: logs.executor.displayAvatarURL(),
      })
      .setColor('#ff0000')
      .setDescription(
        `**Moderator:** \` ${logs.executor.tag} \` [${logs.executor.id}]
     **Member:** \` ${data.targetTag} \` [${data.targetId}]
     **Action:** TimeoutEnd
     **Reason:** Timeout expired based on duration
     **Reference:** [#${data.caseid}](https://discord.com/channels/${oldMember.guild.id}/${modLogs.id}/${data.logMessageId})`,
      )
      .setFooter({ text: `Case ${outIncrease}` })
      .setTimestamp();
    return await modLogs?.send({ embeds: [timeoutEnd] });
  } else if (brunoTimeout) {
    let timeoutData = await oldMember.client.cases.get(
      `SELECT caseId FROM cases WHERE guildid = ${oldMember.guild.id} ORDER BY caseId DESC LIMIT 1;`,
    );

    const timeoutIncrease = timeoutData?.caseid ? ++timeoutData.caseid : 1;

    await oldMember.client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${timeoutIncrease}, ${oldMember.guild.id}, 'TimeoutEnd', 'Timeout expired based on duration',
  ${oldMember.client.user.id},'${oldMember.client.user.tag}', ${oldMember.id}, '${oldMember.user.tag}', '${data.caseid}')`);

    setTimeout(async () => {
      const timeoutEnd = new MessageEmbed()
        .setAuthor({
          name: `${oldMember.client.user.username} (Bot)`,
          iconURL: oldMember.client.user.displayAvatarURL(),
        })
        .setColor('#ff0000')
        .setDescription(
          `**Bot:** \` ${oldMember.client.user.tag} \` [${oldMember.client.user.id}]
       **Member:** \` ${data.targetTag} \` [${data.targetId}]
       **Action:** TimeoutEnd
       **Reason:** Timeout expired based on duration
       **Reference:** [#${data.caseid}](https://discord.com/channels/${oldMember.guild.id}/${modLogs.id}/${data.logMessageId})`,
        )
        .setFooter({ text: `Case ${timeoutIncrease}` })
        .setTimestamp();
      return await modLogs?.send({ embeds: [timeoutEnd] });
    }, ms(data.actionExpiration));
  }
}
