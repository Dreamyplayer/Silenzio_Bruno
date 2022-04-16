import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
  .setName('setprefix')
  .setDescription('Sets a new prefix to this server [Customization of Prefix]')
  .setDefaultPermission(false)
  .addStringOption(option =>
    option.setName('input').setDescription(`[Prefix Update] - must be less than 2 characters.`).setRequired(true),
  );

export async function execute(interaction) {
  const client = interaction.client;
  const newPrefix = interaction.options.getString('input');
  if (newPrefix.length > 2)
    return interaction.reply({ content: 'The input must be <= 2 characters.', ephemeral: true });

  const prefix = await client.bruno.get(`SELECT prefix FROM bruno WHERE guildid = '${interaction.guild.id}'`);

  if (prefix === undefined) {
    await client.bruno.exec(`INSERT into bruno (guildid, prefix) VALUES ('${interaction.guild.id}', '${newPrefix}')`);
  } else {
    await client.bruno.exec(`UPDATE bruno SET prefix = '${newPrefix}' WHERE guildid = '${interaction.guild.id}'`);
  }

  const data = await client.bruno.get(`SELECT prefix FROM bruno WHERE guildid = '${interaction.guild.id}'`);
  interaction.reply({
    content: `➤ Updated __${interaction.guild.name}__ Prefix \n↳ **\`${data.prefix}\`**`,
    ephemeral: true,
  });
}
