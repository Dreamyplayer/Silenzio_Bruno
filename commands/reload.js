import { readdirSync } from 'node:fs';

export async function run(client, message, args) {
  readdirSync(`./commands`).filter(async cmd => {
    console.log(args);
    if (!args[0]) return message.channel.send('\\⚡ specify a Command name or aliases.');
    const commandName = args[0];
    const command = client.commands.get(commandName);
    client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) {
      return message.channel.send(
        `Command Not Found with Name or Alias \`${commandName}\`, ${message.author.username}!`,
      );
    }

    if (cmd.replace('.js', '') === command.data.name) {
      delete require.cache[require.resolve(`./${command.data.name}.js`)];
      try {
        const newCommand = await import(`./${command.data.name}.js`);
        client.commands.set(newCommand.data.name, newCommand);
        message.channel.send(`Command \`${command.data.name}\` was reloaded!`);
      } catch (error) {
        console.log(error);
        message.channel.send(`✘ Error while reloading \`${command.data.name}\`: \n\n\`${error.message}\``);
      }
    }
  });
}

export const data = {
  name: 'reload',
  description: 'Reloads a command',
  aliases: ['r'],
  cooldown: 2,
};

export const requirements = {
  userPerms: [],
  clientPerms: [],
  OwnerOnly: true,
};
