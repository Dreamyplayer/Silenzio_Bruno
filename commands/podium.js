import { MessageEmbed } from 'discord.js';
import { podiumCommand } from './interactions/commands.js';

export const data = podiumCommand;

export async function execute(interaction) {
  const { client, guild, guildId } = interaction;
  const golden = client.emojis.cache.get('973004299330273410');
  const silver = client.emojis.cache.get('973006090897883156');
  const bronze = client.emojis.cache.get('973015339208163358');
  const Puppet = client.emojis.cache.get('973291929716535377');

  const scores = await client.history.all(
    `SELECT userid, userTag, ban, softban, kick, Timeout FROM counts WHERE guildid = ${guildId} LIMIT 10`,
  );

  if (scores === undefined || !scores.length) {
    return interaction.reply({ content: `${Puppet} ***No Stages Found***`, ephemeral: true });
  }

  const board = scores
    .map(score => {
      const { userTag, ban, kick, softban, Timeout } = score;
      const scoress = ban * 8 + softban * 6 + kick * 4 + Timeout * 2;
      return [userTag, scoress];
    })
    .sort((a, b) => b[1] - a[1])
    .map(score => score);

  const scores_obj = board.map(data => data[1]);
  const getUserTags = board.map(score => score[0]);

  const data = `**\`${getUserTags[0]}\`** ━ \`${scores_obj[0]}\`
  **\`${getUserTags[1]}\`** ━ \`${scores_obj[1]}\`
  **\`${getUserTags[2]}\`** ━ \`${scores_obj[2]}\`
  **\`${getUserTags[3]}\`** ━ \`${scores_obj[3]}\`
  **\`${getUserTags[4]}\`** ━ \`${scores_obj[4]}\`
  **\`${getUserTags[5]}\`** ━ \`${scores_obj[5]}\`
  **\`${getUserTags[6]}\`** ━ \`${scores_obj[6]}\`
  **\`${getUserTags[7]}\`** ━ \`${scores_obj[7]}\`
  **\`${getUserTags[8]}\`** ━ \`${scores_obj[8]}\`
  **\`${getUserTags[9]}\`** ━ \`${scores_obj[9]}\``
    .split('\n')
    .filter(e => e !== '  **`undefined`** ━ `undefined`')
    .join('\n');

  const embed = new MessageEmbed()
    .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
    .setTitle('Podium')
    .setDescription(
      `**Top ${data.split('\n').length} Moderators**

    ${golden} ${data.split('\n')[0] ?? ''}

    ${data.split('\n')[1] === undefined ? '' : silver} ${data.split('\n')[1] ?? ''}
    ${data.split('\n')[2] === undefined ? '' : bronze} ${data.split('\n')[2] ?? ''}

    ${data.split('\n')[3] === undefined ? '' : '\\🐢'} ${data.split('\n')[3] ?? ''}
    ${data.split('\n')[4] === undefined ? '' : '\\🐢'} ${data.split('\n')[4] ?? ''}
    ${data.split('\n')[5] === undefined ? '' : '\\🐢'} ${data.split('\n')[5] ?? ''}
    ${data.split('\n')[6] === undefined ? '' : '\\🐢'} ${data.split('\n')[6] ?? ''}
    ${data.split('\n')[7] === undefined ? '' : '\\🐢'} ${data.split('\n')[7] ?? ''}
    ${data.split('\n')[8] === undefined ? '' : '\\🐢'} ${data.split('\n')[8] ?? ''}
    ${data.split('\n')[9] === undefined ? '' : '\\🐢'} ${data.split('\n')[9] ?? ''}`,
    )
    .setColor('#0099ff')
    .setTimestamp();
  interaction.reply({ embeds: [embed] });
}
