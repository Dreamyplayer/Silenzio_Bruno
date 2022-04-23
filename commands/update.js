import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';

export const data = new SlashCommandBuilder()
  .setName('update')
  .setDescription('Updates Case Reason/Reference.')
  .addIntegerOption(option => option.setName('caseid').setDescription('The Case ID').setRequired(true).setMinValue(1))
  .addStringOption(option =>
    option.setName('reason').setDescription('The Reason for the Case, If any').setRequired(false),
  )
  .addIntegerOption(option =>
    option.setName('reference').setDescription('The Reference for the Case, If any').setRequired(false).setMinValue(1),
  );

export async function execute(interaction) {
  const { client, guild, guildId, options } = interaction;
  const Case = options.getInteger('caseid');
  const reason = options.getString('reason');
  const reference = options.getInteger('reference');

  if (!reason && !reference) {
    return interaction.reply({
      content: 'You must provide a reason or reference to update the case.',
      ephemeral: true,
    });
  }

  const ref = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${reference}`);

  const { caseid, caseAction, moderatorId, moderatorTag, targetId, targetTag, logMessageId } = await client.cases.get(
    `SELECT * FROM cases WHERE guildid = ${guildId} AND caseid = ${Case}`,
  );

  const { modLogChannelID } = await client.bruno.get(`SELECT modLogChannelID FROM guild WHERE guildid = ${guildId}`);

  if (caseid === undefined) {
    return interaction.reply({ content: '* Invalid Case ID *', ephemeral: true });
  }

  if (ref === undefined && reference !== null) {
    return interaction.reply({ content: '*Invalid Reference ID*', ephemeral: true });
  }

  await guild.channels.cache
    .get(modLogChannelID)
    .messages.fetch(logMessageId)
    .then(message => {
      const embed = message.embeds[0];

      const owner = guild.ownerId === moderatorId ? 'Owner' : 'Moderator';

      const editEmbed = new MessageEmbed(embed).setDescription(
        `**${owner}:** \` ${moderatorTag} \` [${moderatorId}]
         **Member:** \` ${targetTag} \` [${targetId}]
         **Action:** ${caseAction}
         ${reason ? `**Reason:** ${reason}` : ''}
         ${
           ref
             ? `**Reference:** [#${reference}](https://discord.com/channels/${guildId}/${modLogChannelID}/${ref?.logMessageId})`
             : ''
         }`,
      );

      message.edit({ embeds: [editEmbed] });
    })
    .catch(console.error);

  await client.cases.exec(
    `UPDATE cases SET reason = '${reason ?? undefined}', referenceId = '${
      reference ?? undefined
    }' WHERE caseid = ${caseid}`,
  );

  await interaction.deferReply({ ephemeral: true });
  await wait(4000);
  interaction.editReply({
    content: `✓ **[CASE UPDATED]** - __\`${Case}\`__
  ↳ Reason: ${reason ?? 'None'}
  ${reference ? `↳ Reference: \`#${reference ?? ''}\`` : ''}`,
    ephemeral: true,
  });
}
