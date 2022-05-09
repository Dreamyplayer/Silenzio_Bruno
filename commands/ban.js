import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';
import { BanCommand } from './interactions/commands.js';

export const data = BanCommand;

export async function execute(interaction) {
  const { client, guild, user, guildId, options } = interaction;

  const action = options.getString('commands');
  const member = options.getMember('user');
  const picked = options.getString('delete_messages');
  const reason = options.getString('reason');
  const reference = options.getInteger('reference');

  const ref = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${reference}`);

  const bigReason = reason?.length > 1000 ? reason.substring(0, 1000) + '...' : reason;
  const days = picked === 'dda' ? 0 : picked === '24h' ? 1 : 7;

  if (!member || guild.members.cache.get(member?.id) === undefined) {
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
  VALUES (${increase}, ${guildId}, '${action}', '${reason ?? undefined}', ${days}, ${user.id}, '${user.tag}',
  ${member.id}, '${member.user.tag}', '${reference ?? undefined}')`);

  const modLogs = guild.channels.cache.get(modLogChannelID);

  // Updating Bans count to this banned user
  const history = await client.history.get(`SELECT bans, reports FROM history WHERE userid = '${member.id}'`);

  if (history?.bans === undefined || history?.bans === null) {
    await client.history.exec(`INSERT INTO history (userid, bans) VALUES ('${member.id}', 1)`);
  } else {
    await client.history.exec(`UPDATE history SET bans = bans + 1 WHERE userid = ${member.id}`);
  }

  // Button for Reporting a user
  const row = new MessageActionRow().addComponents(
    new MessageButton().setCustomId('report').setLabel('Report').setStyle('DANGER'),
  );
  const filter = i => i.customId === 'report' && i.user.id === user.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });
  collector.on('collect', async i => {
    if (i.customId === 'report') {
      if (history?.reports === undefined || history?.reports === null) {
        await client.history.exec(`INSERT INTO history (userid, reports) VALUES ('${member.id}', 1)`);
      } else {
        await client.history.exec(`UPDATE history SET reports = reports + 1 WHERE userid = ${member.id}`);
      }

      await i.update({ content: '\\☕ Thanks for the report!', components: [] });
    }
  });

  const owner = guild.ownerId === user.id ? 'Owner' : 'Moderator';

  await interaction.deferReply({ ephemeral: true });
  await wait(4000);

  const embed = new MessageEmbed()
    .setAuthor({
      name: `${user.username} (${owner})`,
      iconURL: user.displayAvatarURL(),
    })
    .setColor('#ed174f')
    .setDescription(
      `**${owner}:** \` ${user.tag} \` [${user.id}]
       **Member:** \` ${member.user.tag} \` [${member.id}]
       **Action:** ${action}
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

  await interaction.editReply({
    content: `► **\`[${action === 'ban' ? 'BANNED' : 'SOFTBAN'}]\`** ${member.user.tag} \`(${member.id})\``,
    components: [row],
  });

  // Usage + points
  const usage = await client.history.get(`SELECT caseAction, total FROM usage WHERE caseAction = '${action}'`);
  if (usage?.caseAction === undefined) {
    await client.history.exec(`INSERT INTO usage (caseAction, total) VALUES ('${action}', 1)`);
  } else {
    await client.history.exec(`UPDATE usage SET total = total + 1 WHERE caseAction = '${action}'`);
  }
  // Points
  const points = await client.history.get(
    `SELECT ${action} FROM counts WHERE guildid = '${guildId}' AND userid = '${user.id}'`,
  );

  if (points?.[`${action}`] === undefined) {
    await client.history.exec(
      `INSERT INTO counts (guildid, userid, userTag, ${action}) VALUES (${guildId}, '${user.id}', '${user.tag}', 1)`,
    );
  } else if (points?.[`${action}`] === null) {
    await client.history.exec(`UPDATE counts SET ${action} = 1 WHERE userid = '${user.id}' AND guildid = ${guildId}`);
  } else {
    await client.history.exec(
      `UPDATE counts SET ${action} = ${action} + 1 WHERE userid = '${user.id}' AND guildid = ${guildId}`,
    );
  }

  if (action === 'ban') {
    console.log(`banning`);
    // await member.ban({ days: days, reason: reason ?? 'No reason provided' }).catch(console.error);
  } else if (action === 'softban') {
    console.log('Softbanning');
    // await guild.bans.create(member, {
    //   days: days,
    //   reason: reason ?? 'No reason provided',
    // }).catch(console.error);
    // await guild.bans.remove(member, reason ?? 'No reason provided').catch(console.error);
  }
}
