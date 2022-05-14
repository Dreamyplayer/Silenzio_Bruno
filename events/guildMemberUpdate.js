import { AuditLogEvent } from 'discord-api-types/v10';
import { MessageEmbed } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';

export const name = 'guildMemberUpdate';
export async function execute(oldMember, newMember) {
  const rolesArray = oldMember.roles.cache.map(role => role.name.endsWith('restricted') && role.id).filter(Boolean);
  const validRoles = oldMember.roles.cache.hasAll(...rolesArray) && !newMember.roles.cache.hasAll(...rolesArray);

  const logs = await oldMember.client.bruno.get(
    `SELECT modLogChannelID FROM guild WHERE guildid = ${oldMember.guild.id}`,
  );
  const modLogs = oldMember.guild.channels.cache.get(logs?.modLogChannelID);

  // Role Update Audit Logs
  const roleAuditLogs = await oldMember.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberRoleUpdate,
  });

  const roleLogs = roleAuditLogs.entries.find(log => {
    return (
      (log.target.id === newMember.id &&
        log.changes.find(c => c.key === '$remove' && c?.new[0].name.endsWith('restricted'))) ??
      false
    );
  });

  const roleUpdate = roleLogs?.changes.find(c => c.key === '$remove');

  const isRoleUpdated = Boolean(roleUpdate?.new[0].name.endsWith('restricted'));

  // ----------------------------------------------------------------------------------------------------------------

  // Timout AuditLogs
  const timeoutAuditLogs = await oldMember.guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.MemberUpdate });

  const timeoutLogs = timeoutAuditLogs.entries.find(log => {
    return (
      (log?.action === 'MEMBER_UPDATE' &&
        log.target.id === newMember.id &&
        log.changes?.some(c => c.key === 'communication_disabled_until')) ??
      false
    );
  });

  const timeoutUpdate = timeoutLogs?.changes.find(c => c.key === 'communication_disabled_until');

  // Manual timeout
  const isTimeoutEnded = Boolean(timeoutUpdate?.old && !timeoutUpdate?.new);

  const timeoutData = await oldMember.client.cases.get(
    `SELECT caseid, actionExpiration, reason, targetId, targetTag, logMessageId FROM cases WHERE guildid = ${oldMember.guild.id}
    AND targetid = ${oldMember.id} AND caseaction = 'Timeout' ORDER BY caseId DESC LIMIT 1;`,
  );

  if (isRoleUpdated && validRoles) {
    const dbRoleData = await oldMember.client.cases.get(
      `SELECT caseid, targetId, targetTag, logMessageId FROM cases WHERE guildid = ${oldMember.guild.id} AND targetid = ${oldMember.id}
      AND caseaction = '${roleUpdate.new[0].name}' ORDER BY caseId DESC LIMIT 1;`,
    );
    const executor =
      roleLogs?.executor.id === '954977884731240488'
        ? 'Automatic unRole based on duration'
        : 'Manual unRole by Moderator';

    const roleData = await oldMember.client.cases.get(
      `SELECT caseId FROM cases WHERE guildid = ${oldMember.guild.id} ORDER BY caseId DESC LIMIT 1;`,
    );

    const roleIncrease = roleData?.caseid ? ++roleData.caseid : 1;

    await oldMember.client.cases.exec(`INSERT INTO cases
      (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
      VALUES (${roleIncrease}, ${oldMember.guild.id}, '${roleUpdate.new[0].name}', '${executor}',
      ${roleLogs.executor.id},'${roleLogs.executor.tag}', ${newMember.id}, '${newMember.user.tag}', '${dbRoleData.caseid}')`);

    const roleEmbed = new MessageEmbed()
      .setAuthor({
        name: `${roleLogs.executor.username} (Moderator)`,
        iconURL: roleLogs.executor.displayAvatarURL(),
      })
      .setColor('#ff0000')
      .setDescription(
        `**Moderator:** \` ${roleLogs.executor.tag} \` [${roleLogs.executor.id}]
     **Member:** \` ${dbRoleData.targetTag} \` [${dbRoleData.targetId}]
     **Action:** UnRole \`${roleUpdate.new[0].name}\`
     **Reason:** ${executor}
     **Reference:** [#${dbRoleData.caseid}](https://discord.com/channels/${oldMember.guild.id}/${modLogs.id}/${dbRoleData.logMessageId})`,
      )
      .setFooter({ text: `Case ${roleIncrease}` })
      .setTimestamp();
    await modLogs
      ?.send({ embeds: [roleEmbed] })
      .then(message =>
        oldMember.client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${roleIncrease}`),
      );
  }

  if (oldMember.communicationDisabledUntil === null && newMember.communicationDisabledUntil === null) {
    return;
  }
  if (isTimeoutEnded) {
    // Timeout End
    let outData = await oldMember.client.cases.get(
      `SELECT caseId FROM cases WHERE guildid = ${oldMember.guild.id} ORDER BY caseId DESC LIMIT 1;`,
    );

    const outIncrease = outData?.caseid ? ++outData.caseid : 1;

    await oldMember.client.cases.exec(`INSERT INTO cases
      (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
      VALUES (${outIncrease}, ${oldMember.guild.id}, 'TimeoutEnd', 'Timeout expired based on duration',
      ${timeoutLogs.executor.id},'${timeoutLogs.executor.tag}', ${newMember.id}, '${newMember.user.tag}', '${timeoutData.caseid}')`);

    const timeoutEndEmbed = new MessageEmbed()
      .setAuthor({
        name: `${timeoutLogs.executor.username} (Moderator)`,
        iconURL: timeoutLogs.executor.displayAvatarURL(),
      })
      .setColor('#ff0000')
      .setDescription(
        `**Moderator:** \` ${timeoutLogs.executor.tag} \` [${timeoutLogs.executor.id}]
         **Member:** \` ${timeoutData.targetTag} \` [${timeoutData.targetId}]
         **Action:** TimeoutEnd
         **Reason:** Timeout Manually removed before duration
         **Reference:** [#${timeoutData.caseid}](https://discord.com/channels/${oldMember.guild.id}/${modLogs.id}/${timeoutData.logMessageId})`,
      )
      .setFooter({ text: `Case ${outIncrease}` })
      .setTimestamp();
    await modLogs
      ?.send({ embeds: [timeoutEndEmbed] })
      .then(message =>
        oldMember.client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${outIncrease}`),
      );
  } else {
    const timerId = wait(timeoutData.actionExpiration).then(async () => {
      if (newMember.communicationDisabledUntil !== null) {
        let timeoutData_new = await oldMember.client.cases.get(
          `SELECT caseId FROM cases WHERE guildid = ${oldMember.guild.id} ORDER BY caseId DESC LIMIT 1;`,
        );

        const timeoutIncrease = timeoutData_new?.caseid ? ++timeoutData_new.caseid : 1;

        await oldMember.client.cases.exec(`INSERT INTO cases
      (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
      VALUES (${timeoutIncrease}, ${oldMember.guild.id}, 'TimeoutEnd', 'Timeout expired based on duration',
      ${oldMember.client.user.id},'${oldMember.client.user.tag}', ${newMember.id}, '${newMember.user.tag}', '${timeoutData.caseid}')`);

        const brunoTimeoutEnd = new MessageEmbed()
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
        await modLogs
          ?.send({ embeds: [brunoTimeoutEnd] })
          .then(message =>
            oldMember.client.cases.exec(
              `UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${timeoutIncrease}`,
            ),
          );
      }
    });
    clearTimeout(timerId);
  }
}
