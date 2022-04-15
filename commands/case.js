import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
  .setName('case')
  .setDescription('View a case')
  .addChannelOption(option => option.setName('channel').setDescription('The channel to look in').setRequired(true));

export async function execute(interaction) {
  // const CaseAction = ['Role', 'Unrole', 'Warn', 'Kick', 'Softban', 'Ban', 'Unban', 'Timeout', 'TimeoutEnd'];

  // interaction.client.db.get(`cases_${interaction.guild.id}`).then(async data => {
  //   await interaction.client.db.set(`cases_${interaction.guild.id}`, {
  //     caseId: ++data.caseId,
  //     action: 'Ban',
  //   });
  // });
  // await interaction.client.db.get(`cases_${interaction.guild.id}`).then(d => {
  //   console.log(d.caseId + ' ' + d.action);
  // });

  // await interaction.client.bruno.all(`SELECT * FROM bruno`);
  // const channel = interaction.options.getChannel('channel');
  // interaction.client.bruno.exec(
  //   `UPDATE guild SET modlogchannelid = ${channel.id} WHERE guildid = ${interaction.guildId}`,
  // );
  interaction.reply({ content: 'Case created', ephemeral: true });
}
