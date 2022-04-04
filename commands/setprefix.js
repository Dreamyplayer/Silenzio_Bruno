import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
  .setName('setprefix')
  .setDescription('Sets a new prefix to this server [Customization of Prefix]')
  .addStringOption(option =>
    option.setName('input').setDescription(`[Prefix Update] - must be less than 2 characters.`).setRequired(true),
  );

export async function execute(interaction) {
  const client = interaction.client;
  const newPrefix = interaction.options.getString('input');
  if (newPrefix.length > 2)
    return interaction.reply({ content: 'The input must be less than 2 characters.', ephemeral: true });

  await client.db.set(`BOT_${interaction.guildId}`, { prefix: `${newPrefix}` });
  await client.db
    .get(`BOT_${interaction.guildId}`)
    .then(data => {
      return interaction.reply({
        content: `➤ Updated __${interaction.guild.name}__ Prefix \n↳ **\`${data.prefix}\`**`,
        ephemeral: true,
      });
    })
    .catch(console.error);
}
