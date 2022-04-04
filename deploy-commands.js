import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { config } from 'dotenv';
import { readdirSync } from 'node:fs';
import { data } from './config.js';

const { CLIENT_ID, GUILD_ID } = data;
config();

const commands = [];
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Global commands are cached for one hour.
    // New global commands will fan out slowly across all guilds and will only be guaranteed to be updated after an hour.
    // Guild commands update instantly.As such, we recommend you use guild - based commands during development
    // and publish them to global commands when they're ready for public use.

    // Guild Commands
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    // Global Commands publish them to global commands when they're ready for public use.
    // await rest.put(Routes.applicationGuildCommands(CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
