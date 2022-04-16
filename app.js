import chalk from 'chalk';
import { Client, Collection, Options, Util } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { cwd } from 'node:process';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
config();

const start = performance.now();

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
  intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_MESSAGES'],
  makeCache: Options.cacheWithLimits({
    ChannelManager: {
      sweepInterval: 3600,
      sweepFilter: Util.archivedThreadSweepFilter(),
    },
    GuildChannelManager: {
      sweepInterval: 3600,
      sweepFilter: Util.archivedThreadSweepFilter(),
    },
    MessageManager: 100,
    StageInstanceManager: 10,
    ThreadManager: {
      sweepInterval: 3600,
      sweepFilter: Util.archivedThreadSweepFilter(),
    },
    VoiceStateManager: 10,
  }),
});

// Database Setup
(async () => {
  const [bruno, cases, history] = await Promise.all([
    open({
      filename: `${cwd()}/database/bruno.db`,
      driver: sqlite3.Database,
    }),
    open({
      filename: `${cwd()}/database/cases.db`,
      driver: sqlite3.Database,
    }),
    open({
      filename: `${cwd()}/database/history.db`,
      driver: sqlite3.Database,
    }),
  ]);

  // sqlite3.verbose();
  // bruno.on('trace', data => console.log(`${chalk.bgGreen('BRUNO:')} ${data}`));
  // cases.on('trace', data => console.log(`${chalk.bgGreen('CASES:')} ${data}`));
  // history.on('trace', data => console.log(`${chalk.bgGreen('HISTORY:')} ${data}`));

  // Migrations
  await bruno.exec('CREATE TABLE IF NOT EXISTS bruno (guildid VARCHAR(20), prefix VARCHAR(5))');
  await bruno.exec(`CREATE TABLE IF NOT EXISTS guild (guildid VARCHAR(20), logchannelId VARCHAR(20),
  modLogChannelID VARCHAR(20), modRoleID VARCHAR(20))`);
  // await bruno.exec(`CREATE TABLE IF NOT EXISTS settings (guildid VARCHAR(20), yt BLOB, discord BLOB,
  // emoji BlOB, spams BLOB)`);

  await cases.exec(
    `CREATE TABLE IF NOT EXISTS cases (caseid INTEGER, guildid VARCHAR(20), caseAction VARCHAR(10),
    roleId VARCHAR(20), actionExpiration TEXT, reason TEXT, moderatorId VARCHAR(20),
    targetId VARCHAR(20), deleteMessageDays INTEGER, contextMessageId VARCHAR(20), logMessageId VARCHAR(20),
    referenceId INTEGER)`,
  );

  await history.exec(
    `CREATE TABLE IF NOT EXISTS history (userid VARCHAR(20), bans INTEGER, timeouts INTEGER, kicks INTEGER,
    spams INTEGER, warns INTEGER, reported INTEGER)`,
  );
  await history.exec(`CREATE TABLE IF NOT EXISTS counts (caseAction VARCHAR(10), usage INTEGER)`);

  // accessible for client
  client.bruno = bruno;
  client.cases = cases;
  client.history = history;
})();

// Setting
client.commands = new Collection();
client.cooldowns = new Collection();
client.aliases = new Map();
const unhandledRejections = new Map();
client.setMaxListeners(20);

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

const end = performance.now() - start;
console.log(`${chalk.bgBlueBright(`${end.toFixed()} ms`)}`);
// Login
client.login(process.env.TOKEN);
