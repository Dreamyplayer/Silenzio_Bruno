import { AuditLogEvent } from 'discord-api-types/v9';
import { MessageEmbed } from 'discord.js';
import ms from 'ms';

export const name = 'guildMemberUpdate';
export async function execute(oldMember, newMember) {
  // Database
  const { modLogChannelID } = await oldMember.client.bruno.get(
    `SELECT modLogChannelID FROM guild WHERE guildid = ${oldMember.guild.id}`,
  );
  const modLogs = oldMember.guild.channels.cache.get(modLogChannelID);

  const roleAuditLogs = await oldMember.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberRoleUpdate,
  });
  const roleLogs = roleAuditLogs.entries.find(log => {
    return (
      (log.target.id === newMember.id &&
        log.changes.find(c => c.key === '$remove' && c?.new[0].name.endsWith('restricted')) &&
        log.createdAt === Date.now()) ??
      false
    );
  });

  const roleChange = roleLogs?.changes.find(c => c.key === '$remove');

  if (roleChange === undefined) console.log('no role change');

  const roleChanged = Boolean(roleChange?.new[0].name.endsWith('restricted'));

  if (roleChanged) {
    const dbRoleData = await oldMember.client.cases.get(
      `SELECT * FROM cases WHERE guildid = ${oldMember.guild.id} AND targetid = ${oldMember.id} AND caseaction = '${roleChange.new[0].name}'
      ORDER BY caseId DESC LIMIT 1;`,
    );
    const roleData = await oldMember.client.cases.get(
      `SELECT caseId FROM cases WHERE guildid = ${oldMember.guild.id} ORDER BY caseId DESC LIMIT 1;`,
    );

    const roleIncrease = roleData?.caseid ? ++roleData.caseid : 1;

    await oldMember.client.cases.exec(`INSERT INTO cases
    (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
    VALUES (${roleIncrease}, ${oldMember.guild.id}, '${roleChange.new[0].name}', 'Automatic unrole based on duration',
    ${roleLogs.executor.id},'${roleLogs.executor.tag}', ${oldMember.id}, '${oldMember.user.tag}', '${dbRoleData.caseid}')`);

    const roleUpdate = new MessageEmbed()
      .setAuthor({
        name: `${roleLogs.executor.username} (Moderator)`,
        iconURL: roleLogs.executor.displayAvatarURL(),
      })
      .setColor('#ff0000')
      .setDescription(
        `**Moderator:** \` ${roleLogs.executor.tag} \` [${roleLogs.executor.id}]
   **Member:** \` ${dbRoleData.targetTag} \` [${dbRoleData.targetId}]
   **Action:** UnRole \`${roleChange.new[0].name}\`
   **Reason:** Automatic unrole based on duration
   **Reference:** [#${dbRoleData.caseid}](https://discord.com/channels/${oldMember.guild.id}/${modLogs.id}/${dbRoleData.logMessageId})`,
      )
      .setFooter({ text: `Case ${roleIncrease}` })
      .setTimestamp();
    return await modLogs
      ?.send({ embeds: [roleUpdate] })
      .then(message =>
        oldMember.client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${roleIncrease}`),
      );
  }
  // ---------------------------------------------------------------------------------------------------------------
  const auditLogs = await oldMember.guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.MemberUpdate });
  const logs = auditLogs.entries.find(log => {
    return (
      (log.target.id === newMember.id && log.changes?.some(c => c.key === 'communication_disabled_until')) ?? false
    );
  });

  if (!logs?.changes) {
    return;
  }

  let timeoutData = await oldMember.client.cases.get(
    `SELECT * FROM cases WHERE guildid = ${oldMember.guild.id} AND targetid = ${oldMember.id} AND caseaction = 'Timeout' ORDER BY caseId DESC LIMIT 1;`,
  );

  const timeoutChange = logs.changes.find(c => c.key === 'communication_disabled_until');

  // Manual timeout
  const timeoutEnded = Boolean(timeoutChange.old && !timeoutChange.new);

  // Bruno Timeout
  const brunoTimeout =
    (logs.reason === timeoutData.reason) === undefined
      ? timeoutData.reason
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
  ${oldMember.id}, '${oldMember.user.tag}', '${timeoutData.caseid}')`);

    const timeoutEnd = new MessageEmbed()
      .setAuthor({
        name: `${logs.executor.username} (Moderator)`,
        iconURL: logs.executor.displayAvatarURL(),
      })
      .setColor('#ff0000')
      .setDescription(
        `**Moderator:** \` ${logs.executor.tag} \` [${logs.executor.id}]
     **Member:** \` ${timeoutData.targetTag} \` [${timeoutData.targetId}]
     **Action:** TimeoutEnd
     **Reason:** Timeout expired based on duration
     **Reference:** [#${timeoutData.caseid}](https://discord.com/channels/${oldMember.guild.id}/${modLogs.id}/${timeoutData.logMessageId})`,
      )
      .setFooter({ text: `Case ${outIncrease}` })
      .setTimestamp();
    return await modLogs
      ?.send({ embeds: [timeoutEnd] })
      .then(message =>
        oldMember.client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${outIncrease}`),
      );
  } else if (brunoTimeout) {
    let timeoutData_new = await oldMember.client.cases.get(
      `SELECT caseId FROM cases WHERE guildid = ${oldMember.guild.id} ORDER BY caseId DESC LIMIT 1;`,
    );

    const timeoutIncrease = timeoutData_new?.caseid ? ++timeoutData_new.caseid : 1;

    await oldMember.client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${timeoutIncrease}, ${oldMember.guild.id}, 'TimeoutEnd', 'Timeout expired based on duration',
  ${oldMember.client.user.id},'${oldMember.client.user.tag}', ${oldMember.id}, '${oldMember.user.tag}', '${timeoutData.caseid}')`);

    setTimeout(async () => {
      const timeoutEnd = new MessageEmbed()
        .setAuthor({
          name: `${oldMember.client.user.username} (Bot)`,
          iconURL: oldMember.client.user.displayAvatarURL(),
        })
        .setColor('#ff0000')
        .setDescription(
          `**Bot:** \` ${oldMember.client.user.tag} \` [${oldMember.client.user.id}]
       **Member:** \` ${timeoutData.targetTag} \` [${timeoutData.targetId}]
       **Action:** TimeoutEnd
       **Reason:** Timeout expired based on duration
       **Reference:** [#${timeoutData.caseid}](https://discord.com/channels/${oldMember.guild.id}/${modLogs.id}/${timeoutData.logMessageId})`,
        )
        .setFooter({ text: `Case ${timeoutIncrease}` })
        .setTimestamp();
      return await modLogs?.send({ embeds: [timeoutEnd] });
    }, ms(timeoutData.actionExpiration));
  }
}
