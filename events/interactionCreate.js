import chalk from 'chalk';
export const name = 'interactionCreate';
export async function execute(interaction) {
  if (!interaction.isCommand()) return;
  const client = interaction.client;
  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`${chalk.bgGreen('[INTERACTION ERROR]')} ${error}`);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
}
