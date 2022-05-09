import { Formatters, MessageEmbed } from 'discord.js';
import ms from 'ms';
import { setTimeout as wait } from 'node:timers/promises';
import { warnCommand } from './interactions/commands.js';

export const data = warnCommand;

export async function execute(interaction) {
  const { client, guild, user, guildId, options, channel } = interaction;

  const member = options.getMember('user');
  const reason = options.getString('reason');
  const reference = options.getInteger('reference');
  const bigReason = reason?.length > 1000 ? reason.substring(0, 1000) + '...' : reason;
  const precise = client.emojis.cache.get('970397401045139486');
  const erroneous = client.emojis.cache.get('970397421697912963');

  if (member === undefined || guild.members.cache.get(member?.id) === undefined) {
    return interaction.reply({ content: `${erroneous} *User not found*`, ephemeral: true });
  }

  if (member?.manageable === false) {
    return interaction.reply({
      content: `*You don't have the appropriate permissions to warn that user.*`,
      ephemeral: true,
    });
  }

  const ref = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${reference}`);

  if (ref === undefined && reference !== null) {
    return interaction.reply({ content: '*Invalid Reference ID*', ephemeral: true });
  }

  const { modLogChannelID } = await client.bruno.get(`SELECT modLogChannelID FROM guild WHERE guildid = ${guildId}`);
  const modLogs = guild.channels.cache.get(modLogChannelID);

  let data = await client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const increase = data?.caseid ? ++data.caseid : 1;

  await client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${increase}, ${guildId}, 'warn', '${reason ?? undefined}', ${user.id}, '${user.tag}',
  ${member.id}, '${member.user.tag}', '${reference ?? undefined}')`);

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
     **Action:** warn
     ${reason ? `**Reason:** ${bigReason}` : ''}
     ${
       reference
         ? `**Reference:** [#${reference}](https://discord.com/channels/${guildId}/${modLogs.id}/${ref?.logMessageId})`
         : ''
     }`,
    )
    .setFooter({ text: `Case ${increase}` })
    .setTimestamp();
  await modLogs?.send({ embeds: [embed] }).then(async message => {
    const history = await client.history.get(`SELECT warns FROM history WHERE userid = '${member.id}'`);

    console.log(history);
    if (history?.warns === undefined) {
      await client.history.exec(`INSERT INTO history (userid, warns) VALUES ('${member.id}', 1)`);
    } else if (history?.warns === null) {
      await client.history.exec(`UPDATE history SET warns = 1 WHERE userid = ${member.id}`);
    } else {
      await client.history.exec(`UPDATE history SET warns = warns + 1 WHERE userid = ${member.id}`);
    }

    const updatedHistory = await client.history.get(`SELECT warns FROM history WHERE userid = '${member.id}'`);

    console.log(updatedHistory);
    const totalWarns =
      updatedHistory?.warns === 2
        ? 'Timeout'
        : updatedHistory?.warns === 4
        ? 'kick'
        : updatedHistory?.warns >= 6
        ? 'ban'
        : `${updatedHistory?.warns}/3`;

    console.log(totalWarns);
    switch (totalWarns) {
      case 'Timeout':
        await member
          .timeout(ms('1d'), `Warns limit reached: Added Timeout by ${client.user.username}`)
          .catch(console.error);
        break;
      case 'kick':
        await member.kick(`Warns limit reached: Proceed Kick by ${client.user.username}`).catch(console.error);
        break;
      case 'ban':
        await member
          .ban({ days: 7, reason: `Warns limit reached: Proceed Ban by ${client.user.username}` })
          .catch(console.error);
        await client.history.exec(`UPDATE history SET warns = null WHERE userid = '${member.id}'`);
        break;
    }

    switch (totalWarns) {
      case 'Timeout':
      case 'kick':
      case 'ban':
        let actionData = await client.cases.get(
          `SELECT caseId FROM cases WHERE guildid = ${guildId} ORDER BY caseId DESC LIMIT 1;`,
        );
        const actionIncrease = actionData?.caseid ? ++actionData.caseid : 1;

        await client.cases.exec(`INSERT INTO cases
        (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag)
        VALUES (${actionIncrease}, ${guildId}, '${totalWarns}', 'Warns limit reached: ${totalWarns} by ${client.user.username}',
        ${user.id}, '${user.tag}', ${member.id}, '${member.user.tag}')`);

        const actionEmbed = new MessageEmbed()
          .setAuthor({
            name: `${client.user.username} (Bot)`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setColor('#ed174f')
          .setDescription(
            `**Bot:** \` ${client.user.tag} \` [${client.user.id}]
           **Member:** \` ${member.user.tag} \` [${member.id}]
           **Action:** ${totalWarns}
           **Reason:** Warns limit reached: \`Proceed ${totalWarns}\``,
          )
          .setFooter({ text: `Case ${actionIncrease}` })
          .setTimestamp();
        await modLogs
          ?.send({ embeds: [actionEmbed] })
          .then(message =>
            client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${actionIncrease}`),
          );
        break;
    }

    const nextWarns =
      updatedHistory?.warns === 1
        ? 'Timeout'
        : updatedHistory?.warns === 3
        ? 'Kick'
        : updatedHistory?.warns === 5
        ? 'Ban'
        : updatedHistory?.warns === 2
        ? 'TIMED OUT'
        : updatedHistory?.warns === 4
        ? 'KICKED'
        : updatedHistory?.warns >= 6
        ? 'BANNED'
        : totalWarns;

    const dmEmbed = new MessageEmbed().setDescription(`\n\\☕ You have been warned ${Formatters.hyperlink(
      'show',
      `https://discord.com/channels/${guildId}/${modLogs?.id}/${message?.id}`,
      ['Click to view case details'],
    )}
    \n${precise} **${nextWarns === nextWarns.toUpperCase() ? 'Current' : 'Next'} Process:** \`${
      nextWarns === 'BANNED' ? 'BANNED & RESET' : nextWarns
    }\``);

    try {
      await member?.send({
        embeds: [dmEmbed],
      });
    } catch (error) {
      if (error.message === 'Cannot send messages to this user') {
        channel.send({
          content: `${erroneous} *${Formatters.userMention(member.id)} has DM's disabled*`,
          embeds: [dmEmbed],
        });
      }
    }

    switch (totalWarns) {
      case 'Timeout':
      case 'kick':
      case 'ban':
        console.log(totalWarns, 'Warns limit reached');
        // Usage + points
        const usage = await client.history.get(
          `SELECT caseAction, total FROM usage WHERE caseAction = '${totalWarns}'`,
        );
        if (usage?.caseAction === undefined) {
          await client.history.exec(`INSERT INTO usage (caseAction, total) VALUES ('${totalWarns}', 1)`);
        } else {
          await client.history.exec(`UPDATE usage SET total = total + 1 WHERE caseAction = '${totalWarns}'`);
        }
        // Points
        const points = await client.history.get(
          `SELECT ${totalWarns} FROM counts WHERE guildid = '${guildId}' AND userid = '${user.id}'`,
        );

        if (points?.[`${totalWarns}`] === undefined) {
          await client.history.exec(
            `INSERT INTO counts (guildid, userid, userTag, ${totalWarns}) VALUES (${guildId}, '${user.id}', '${user.tag}', 1)`,
          );
        } else if (points?.[`${totalWarns}`] === null) {
          await client.history.exec(
            `UPDATE counts SET ${totalWarns} = 1 WHERE userid = '${user.id}' AND guildid = ${guildId}`,
          );
        } else {
          await client.history.exec(
            `UPDATE counts SET ${totalWarns} = ${totalWarns} + 1 WHERE userid = '${user.id}' AND guildid = ${guildId}`,
          );
        }
        break;

      default:
        break;
    }

    await interaction.deferReply({ ephemeral: true });
    await wait(3000);
    interaction.editReply({ content: `► **\`[WARNED]\`**: ${member.user.tag} \`[${member.id}]\`` });
    client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${increase}`);
  });
}
