import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kicks a Member')
  .setDefaultPermission(false)
  .addUserOption(option => option.setName('user').setDescription('The member to kick').setRequired(true))
  .addStringOption(option =>
    option.setName('reason').setDescription('The Reason for Kicking, if any').setRequired(false),
  )
  .addIntegerOption(option =>
    option.setName('reference').setDescription('The Reference for Kicking, if any').setRequired(false).setMinValue(1),
  );

export async function execute(interaction) {
  const { client, guild, user, guildId, options } = interaction;

  const member = options.getMember('user');
  const reason = options.getString('reason');
  const reference = options.getInteger('reference');

  const bigReason = reason?.length > 3000 ? reason.substring(0, 3000) + '...' : reason;
  const ref = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${reference}`);

  if (!member) {
    return interaction.reply({ content: 'User not found', ephemeral: true });
  }
  if (member?.manageable === false) {
    return interaction.reply({
      content: `You don't have the appropriate permissions to kick that user.`,
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
  (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${increase}, ${guildId}, 'Kick', '${reason ?? undefined}', ${user.id},'${user.tag}',
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
       **Action:** Kick
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
  const history = await client.history.get(`SELECT kicks, reports FROM history WHERE userid = '${member.id}'`);

  if (history.kicks === undefined || history.kicks === null) {
    await client.history.exec(`INSERT INTO history (userid, kicks) VALUES ('${member.id}', 1)`);
  } else {
    await client.history.exec(`UPDATE history SET kicks = kicks + 1 WHERE userid = ${member.id}`);
  }

  // await member.kick(reason);

  await interaction.deferReply({ ephemeral: true });
  await wait(4000);

  // Button for Reporting a user
  const row = new MessageActionRow().addComponents(
    new MessageButton().setCustomId('report').setLabel('Report').setStyle('DANGER'),
  );
  const filter = i => i.customId === 'report' && i.user.id === user.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });
  collector.on('collect', async i => {
    if (i.customId === 'report') {
      if (history.reports === undefined || history.reports === null) {
        await client.history.exec(`INSERT INTO history (userid, reports) VALUES ('${member.id}', 1)`);
      } else {
        await client.history.exec(`UPDATE history SET reports = reports + 1 WHERE userid = ${member.id}`);
      }

      await i.update({ content: '\\☕ Thanks for the report!', components: [] });
    }
  });

  await interaction.editReply({
    content: `► **\`[KICKED]\`** ${member.user.tag} \`(${member.id})\``,
    components: [row],
  });
}
