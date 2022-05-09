import { MessageEmbed } from 'discord.js';
import { podiumCommand } from './interactions/commands.js';

export const data = podiumCommand;

export async function execute(interaction) {
  const { client, guild, guildId } = interaction;
  const golden = client.emojis.cache.get('973004299330273410');
  const silver = client.emojis.cache.get('973006090897883156');
  const bronze = client.emojis.cache.get('973015339208163358');
  const flash = client.emojis.cache.get('973018833537351680');

  const scores = await client.history.all(
    `SELECT userid, ban, softban, kick, Timeout FROM counts WHERE guildid = ${guildId} LIMIT 10`,
  );

  if (scores === undefined) {
    return interaction.reply(`No Stages Found.`);
  }

  const board = scores.map(score => {
    const { userid, ban, kick, softban, Timeout } = score;
    const scoress = ban * 8 + softban * 6 + kick * 4 + Timeout * 2;
    return { userid, scoress };
  });

  const scores_arr = board.map(score => score.scoress).sort((a, b) => b - a);
  const getUserIDs = board.map(score => score.userid);

  const scored_user = await guild.members.fetch({ user: getUserIDs }).then(data => data.map(member => member.user.tag));

  const data = `**\`${scored_user[0]}\`** ━ \`${scores_arr[0]}\`
  **\`${scored_user[1]}\`** ━ \`${scores_arr[1]}\`
  **\`${scored_user[2]}\`** ━ \`${scores_arr[2]}\`
  **\`${scored_user[3]}\`** ━ \`${scores_arr[3]}\`
  **\`${scored_user[4]}\`** ━ \`${scores_arr[4]}\`
  **\`${scored_user[5]}\`** ━ \`${scores_arr[5]}\`
  **\`${scored_user[6]}\`** ━ \`${scores_arr[6]}\`
  **\`${scored_user[7]}\`** ━ \`${scores_arr[7]}\`
  **\`${scored_user[8]}\`** ━ \`${scores_arr[8]}\`
  **\`${scored_user[9]}\`** ━ \`${scores_arr[9]}\``
    .split('\n')
    .filter(e => e !== '  **`undefined`** ━ `undefined`')
    .join('\n');

  const embed = new MessageEmbed()
    .setTitle('Podium')
    .setDescription(
      `Top 10 Moderators
    ${golden} ${data.replace(/undefined/g, `Unknown#0000`).split('\n')[0]}

    ${silver} ${data.replace(/undefined/g, `Unknown#0000`).split('\n')[1]}
    ${bronze} ${data.replace(/undefined/g, `Unknown#0000`).split('\n')[2]}

    ${flash} ${data
        .replace(/undefined/g, `Unknown#0000`)
        .split('\n')
        .slice(3, 10)
        .join(`\n${flash}`)}`,
    )
    .setColor('#0099ff')
    .setTimestamp();
  interaction.reply({ embeds: [embed], ephemeral: true });
}
