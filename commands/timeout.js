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
  const member = interaction.options.getMember('user');
  const options = interaction.options.getString('options');
  const duration = interaction.options.getInteger('duration');
  const reason = interaction.options.getString('reason');
  const bigReason = reason?.length > 3000 ? reason.substring(0, 3000) + '...' : reason;
  const milliseconds = ms(`${duration}${options}`);
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
  await wait(5000);
  const logChannel = await interaction.client.bruno.get(
    `SELECT modLogChannelID FROM channels WHERE guildid = ${interaction.guild.id}`,
  );
  const modLogs = interaction.guild.channels.cache.get(logChannel.modLogChannelID);

  let data = await interaction.client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${interaction.guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const increase = data?.caseid ? ++data.caseid : 1;

  await interaction.client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, actionexpiration, reason, moderatorid, targetid)
  VALUES (${increase}, ${interaction.guildId}, 'Timeout', ${milliseconds}, '${reason ?? undefined}', ${
    interaction.user.id
  },
  ${member.id})`);

  const owner = interaction.guild.ownerId === interaction.user.id ? 'Owner' : 'Moderator';
  const embed = new MessageEmbed()
    .setAuthor({
      name: `${interaction.user.username} (${owner})`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setColor('#ff0000')
    .setDescription(
      `**${owner}:** \` ${interaction.user.tag} \` [${interaction.user.id}]
       **Member:** \` ${member.user.tag} \` [${member.id}]
       **Action:** Timeout
       **Action Expiration:** \` ${msToTime} \`
       ${reason ? `**Reason:** ${bigReason}` : ''}`,
    )
    .setFooter({ text: `Case ${increase}` })
    .setTimestamp();
  await modLogs
    ?.send({ embeds: [embed] })
    .then(message =>
      interaction.client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${increase}`),
    );

  // Timeout End
  let outData = await interaction.client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${interaction.guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const outIncrease = outData?.caseid ? ++outData.caseid : 1;

  await interaction.client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, actionexpiration, reason, moderatorid, targetid)
  VALUES (${outIncrease}, ${interaction.guildId}, 'TimeoutEnd', ${milliseconds}, '${reason ?? undefined}', ${
    interaction.user.id
  },
  ${member.id})`);

  const messageid = await interaction.client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${increase}`);
  setTimeout(async () => {
    const timeoutEnd = new MessageEmbed()
      .setAuthor({
        name: `${interaction.client.user.username} (Bot)`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setColor('#ff0000')
      .setDescription(
        `**Bot:** \` ${interaction.client.user.tag} \` [${interaction.client.user.id}]
       **Member:** \` ${member.user.tag} \` [${member.id}]
       **Action:** TimeoutEnd
       **Reason:** Timeout expired based on duration
       **Reference:** [#${increase}](https://discord.com/channels/${interaction.guildId}/${modLogs.id}/${messageid.logMessageId})`,
      )
      .setFooter({ text: `Case ${outIncrease}` })
      .setTimestamp();
    await modLogs?.send({ embeds: [timeoutEnd] });
  }, milliseconds);

  // Updating Bans count to this banned user
  const timeouts = await interaction.client.history.get(`SELECT timeouts FROM history WHERE userid = '${member.id}'`);

  if (timeouts === undefined) {
    await interaction.client.history.exec(`INSERT INTO history (userid, timeouts) VALUES ('${member.id}', 1)`);
  } else {
    await interaction.client.history.exec(`UPDATE history SET timeouts = timeouts + 1 WHERE userid = ${member.id}`);
  }

  interaction.editReply({
    content: `► **\`[Timeout]\`** \`${member.user.tag}\` [${member.id}] \n↳ **\`(${msToTime})\`**`,
  });

  member.timeout(milliseconds, reason ?? 'They deserved it').catch(console.error);
}
