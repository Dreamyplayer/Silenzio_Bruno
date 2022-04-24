import chalk from 'chalk';
import { ApplicationCommandPermissionType } from 'discord-api-types/v10';
export const name = 'interactionCreate';
export async function execute(interaction) {
  if (!interaction.isCommand() && !interaction.isContextMenu()) {
    return;
  }

  if (!interaction.inCachedGuild()) {
    return;
  }

  const { client } = interaction;
  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  // Permissions roles setup
  const { modRoleID } = await client.bruno.get(`SELECT modRoleID FROM guild WHERE guildID = '${interaction.guild.id}'`);

  await client.guilds.cache
    .get(interaction.guildId)
    ?.commands.fetch()
    .then(async commands => {
      commands.map(async cmds => {
        const permissions = [
          {
            id: modRoleID,
            type: ApplicationCommandPermissionType.Role,
            permission: true,
          },
        ];
        await cmds.permissions.add({ permissions });
      });
    });

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`${chalk.bgGreen('[INTERACTION ERROR]')} ${error}`);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
}
