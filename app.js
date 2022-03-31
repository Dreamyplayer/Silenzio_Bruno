import chalk from 'chalk';
import { Client, Collection } from 'discord.js';
import { config } from 'dotenv';
import Keyv from 'keyv';
import { readdirSync } from 'node:fs';
config();

const client = new Client({
  shards: 'auto',
  fetchAllMembers: false,
  disableMentions: 'everyone',
  allowedMentions: { parse: ['roles', 'users'] },
  disabledEvents: ['TYPING_START'],
  restWsBridgeTimeout: 6000,
  restTimeOffset: 6000,
  restRequestTimeout: 25000,
  restSweepInterval: 60,
  retryLimit: 1,
  intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS'],
});

// Database Setup
const modlogs = new Keyv('sqlite://Database/modlogs.sqlite');
modlogs.on('error', err => console.error('CONNECTION ERROR:', chalk.green(err)));

// Setting
client.commands = new Collection();
client.cooldowns = new Collection();
client.aliases = new Map();
client.db = modlogs;
const unhandledRejections = new Map();

// Commands Handler
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Events Handler
const eventFiles = readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = await import(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.on('warn', console.log);

// NodeJs Events Error Handling
process.on('unhandledRejection', (error, promise) => {
  console.error(`🍰 ${chalk.green('Unhandled promise rejection:')}`, error);
  unhandledRejections.set(promise, error);
});

process.on('rejectionHandled', promise => {
  unhandledRejections.delete(promise);
});

process.on('warning', warning => {
  console.warn(`Name: ${warning.name} \nMessage: ${warning.message} \nStack: ${warning.stack}`);
});

process.on('uncaughtException', (err, origin) => {
  console.error(
    `[${new Date().toUTCString()}] ⚡ UncaughtException: Message ${chalk.yellow(err.message)} Stack: ${
      err.stack
    } \nException origin: ${origin}`,
  );
});

// Login
client.login(process.env.TOKEN);
