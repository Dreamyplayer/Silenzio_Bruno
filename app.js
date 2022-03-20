import chalk from 'chalk';
import { Client, Collection } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

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
  intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS'],
});

// Setting
client.commands = new Collection();
client.cooldowns = new Collection();
client.aliases = new Map();
const unhandledRejections = new Map();

client.once('ready', () => {
  console.log('Ready!');
});

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
