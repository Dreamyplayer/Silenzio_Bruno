import { Collection } from 'discord.js';
import { data } from '../config.js';
const { OWNERS } = data;

export const name = 'messageCreate';

export async function execute(message) {
  if (message.author.bot) return;
  if (message.channel.type === 'dm') return;
  const client = message.client;

  const prefix =
    (await client.bruno
      .get(`SELECT prefix FROM bruno WHERE guildid = '${message.guild.id}'`)
      .then(data => data.prefix)) ?? '|';

  // Message Handler
  const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);

  if (message.content.match(new RegExp(`^<@!?${client.user.id}>$`))) {
    return message.channel.send(
      `${client.user.username} \\💪 \n**◢** __Default:__ **\`|\`** \n**◢** __Server:__ **\`${prefix}\`** \n**↳** __Slash Commands:__ **\`/\`** `,
    );
  }

  const args = message.content.split(/ +/g);
  const command = args.shift().slice(matchedPrefix.length).toLowerCase();
  const cmd =
    client.commands.get(command) || client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(command));

  if (!message.content.toLowerCase().startsWith(prefix)) return;

  if (!cmd) return;
  if (!message.guild.me.permissions.has('SEND_MESSAGES')) return;

  if (cmd.requirements.OwnerOnly && !OWNERS.includes(message.author.id)) return;

  if (cmd.requirements.userPerms && !message.member.permissions.has(cmd.requirements.userPerms))
    return message.channel.send(
      `> \`${message.author.tag}\`, \\⚡ Required***** **${missingPerms(
        message.member,
        cmd.requirements.userPerms,
      )}** Permissions.`,
    );

  if (cmd.requirements.clientPerms && !message.guild.me.permissions.has(cmd.requirements.clientPerms))
    return message.channel.send(
      `> ✘ \`${client.user.username}\`, \\⚡ Missing***** **${missingPerms(
        message.guild.me,
        cmd.requirements.clientPerms,
      )}** Permissions.`,
    );

  // Coool Downs . . .D.js
  if (!client.cooldowns.has(cmd.data.name)) {
    client.cooldowns.set(cmd.data.name, new Collection());
  }

  const now = Date.now();
  const timestamps = client.cooldowns.get(cmd.data.name);
  const cooldownAmount = (cmd.data.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.channel.send(
        `\`${message.author.username}\` \n**🙏 Please wait \`${timeLeft.toFixed(
          1,
        )}\` Second(s) before reusing the ✍ \`${command}\` command.**`,
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  cmd.run(client, message, args);
}

const missingPerms = (member, perms) => {
  const missingPerms = member.permissions.missing(perms).map(
    str =>
      `**${str
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b(\w)/g, char => char.toUpperCase())}**`,
  );

  return missingPerms.length > 1
    ? `${missingPerms.slice(0, -1).join(', ')} and ${missingPerms.slice((-1)[0])}`
    : missingPerms[0];
};
