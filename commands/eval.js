import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { inspect } from 'node:util';

export const data = new SlashCommandBuilder()
  .setName('eval')
  .setDescription('Evaluates given string of code')
  .setDefaultPermission(false) // setting false disables the command
  .addStringOption(option => option.setName('code').setDescription('Code to evaluate').setRequired(true));

export async function execute(interaction) {
  const client = interaction.client;
  const code = interaction.options.getString('code');
  const token = client.token.split('').join('[^]{0,2}');
  const rev = client.token.split('').reverse().join('[^]{0,2}');
  const filter = new RegExp(`${token}|${rev}`, 'g');
  try {
    // eslint-disable-next-line no-eval
    let output = eval(code);
    if (
      output instanceof Promise ||
      (Boolean(output) && typeof output.then === 'function' && typeof output.catch === 'function')
    )
      output = await output;
    output = inspect(output, { depth: 0, maxArrayLength: null });
    output = output.replace(filter, '[TOKEN]');
    output = clean(output);
    if (output.length < 1950) {
      let embed = new MessageEmbed()
        .setColor('RANDOM')
        .setDescription(
          `
        🚬 Input \n\`\`\`js\n${code}\n\`\`\`
        ☕ Output \n\`\`\`js\n${output}\n\`\`\``,
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply(`Output was to long`);
    }
  } catch (error) {
    await interaction.reply(`The following error occured \`\`\`js\n${error.stack}\`\`\``);
  }
  function clean(text) {
    return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
  }
}
