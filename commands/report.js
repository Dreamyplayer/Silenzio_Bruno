import { MessageEmbed } from 'discord.js';
import { reportCommand } from './interactions/commands.js';

export const data = reportCommand;

export async function execute(interaction) {
  const { options, guild, user, client, guildId } = interaction;
  const reportedUser = options.getUser('user');
  const proof = options.getString('proof');

  const logs = await client.bruno.get(`SELECT logchannelId FROM guild WHERE guildid = ${guildId}`);
  const logsChannel = guild.channels.cache.get(logs?.logchannelId);

  const imgRegex = /(http)?s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|gif|png|svg))/gi;
  const ss = proof.match(imgRegex)?.join('\n')?.split(' ');

  if (!ss || ss === undefined || ss === null) {
    const embed = new MessageEmbed()
      .setTitle('Reported')
      .setDescription(
        `**Reported by:** \`${user.tag}\` (${user.id})
      **User:** \`${reportedUser.tag ?? 'Unknown#0000'}\` (${reportedUser.id ?? reportedUser})
      **Reason:** ${proof}`,
      )
      .setColor('#ff0000')
      .setTimestamp();
    logsChannel?.send({ embeds: [embed] });
  } else {
    const embed = new MessageEmbed()
      .setTitle('Reported')
      .setDescription(
        `**Reported by:** \`${user.tag}\` (${user.id})
      **User:** \`${reportedUser.tag ?? 'Unknown#0000'}\` (${reportedUser.id ?? reportedUser})
      ${proof.replace(imgRegex, '').length === 0 ? '' : `**Reason:** ${proof.replace(imgRegex, '')}`}
      ${ss.length > 1 ? `\n**Proofs:** \n\`${ss.slice(1, 4).join('\n') ?? ''}\`` : '\n**Proof:**'}`,
      )
      .setImage(ss[0])
      .setColor('#ff0000')
      .setTimestamp();
    logsChannel?.send({ embeds: [embed] });
  }

  interaction.reply({
    content: `**Thanks for reporting!** *Our Moderators will start investigating this issue. * \\☕`,
    ephemeral: true,
  });
}
