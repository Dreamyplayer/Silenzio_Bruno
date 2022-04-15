import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
  .setName('timeoutend')
  .setDescription('Ends Member timeout.')
  .addUserOption(option => option.setName('user').setDescription('The member to timeoutEnd').setRequired(true))
  .addStringOption(option =>
    option.setName('reason').setDescription('The reason for the timeoutEnd').setRequired(false),
  );

export async function execute(interaction) {
  const member = interaction.options.getMember('user');
  const reason = interaction.options.getString('reason') ?? 'Removing Timeout as Mod Requested';

  if (!member) {
    return interaction.reply({ content: 'User not found', ephemeral: true });
  }
  if (member?.manageable === false) {
    return interaction.reply({
      content: `You don't have the appropriate permissions to timeout that user.`,
      ephemeral: true,
    });
  }
  if (!member.isCommunicationDisabled()) {
    return interaction.reply({
      content: `${member.user.tag} is not timed out yet.`,
      ephemeral: true,
    });
  }

  let data = await interaction.client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${interaction.guildId} AND targetid = ${member.id} AND caseaction = 'Timeout' ORDER BY caseId DESC LIMIT 1;`,
  );

  console.log(data.caseid);
  interaction.client.cases.exec(`UPDATE cases SET actionexpiration = 1000 WHERE userid = ${data.caseid}`);
  interaction.reply({ content: 'Timeout ended.' });
  member.timeout(1000, reason).catch(console.error);
}
