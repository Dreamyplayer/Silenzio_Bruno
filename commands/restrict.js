import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import ms from 'ms';
import { setTimeout as wait } from 'node:timers/promises';
import { capitalize } from '../utils/functions.js';

export const data = new SlashCommandBuilder()
  .setName('restrict')
  .setDescription('Restrict a member of this guild/server.')
  .setDefaultPermission(false)
  .addUserOption(option => option.setName('user').setDescription('The member to restrict').setRequired(true))
  .addStringOption(option =>
    option
      .setName('commands')
      .setDescription('Select a action to restrict.')
      .setRequired(true)
      .addChoice('Embed', 'embed')
      .addChoice('Emoji', 'emoji')
      .addChoice('React', 'react'),
  )
  .addStringOption(option =>
    option
      .setName('options')
      .setDescription('How long to timeout the member for')
      .setRequired(true)
      .addChoices(
        [
          ['seconds', 's'],
          ['minutes', 'm'],
          ['hours', 'h'],
          ['days', 'd'],
          ['weeks', 'w'],
        ],
        true,
      ),
  )
  .addIntegerOption(option =>
    option.setName('duration').setDescription('How long to timeout the member for').setRequired(true),
  )
  .addStringOption(option =>
    option.setName('reason').setDescription('The reason for the restriction, If any').setRequired(false),
  )
  .addStringOption(option =>
    option.setName('reference').setDescription('The reference for the restriction, If any').setRequired(false),
  );

export async function execute(interaction) {
  const { client, guild, user, guildId, options } = interaction;

  const action = options.getString('commands');
  const member = options.getMember('user');
  const picked = options.getString('options');
  const duration = options.getInteger('duration');
  const reason = options.getString('reason');
  const reference = options.getString('reference');

  const ref = await client.cases.get(`SELECT logMessageId FROM cases WHERE caseid = ${reference}`);
  const textChannel = guild.channels.cache.map(ch => ch.type === 'GUILD_TEXT' && ch).filter(Boolean);
  const position = guild.roles.cache.find(r => r.tags.botId === '954977884731240488').position;
  const milliseconds = ms(`${duration}${picked}`);
  const msToTime = ms(milliseconds, { long: true });

  const bigReason = reason?.length > 3000 ? reason.substring(0, 3000) + '...' : reason;

  switch (action) {
    case 'embed':
      const embedRoleTop = guild.roles.cache.find(r => r.name === 'Embed restricted' && r.permissions.bitfield === 0n);

      if (embedRoleTop === undefined) {
        await guild.roles
          .create({
            name: 'Embed restricted',
            color: '#C0C0C0',
            hoist: false,
            position: position,
            permissions: 0n,
            mentionable: false,
          })
          .catch(console.error);
      }

      // had to fetch role again to avoid old results.
      const embedRole = guild.roles.cache.find(r => r.name === 'Embed restricted' && r.permissions.bitfield === 0n);

      // overWrite permissions only to text channels
      textChannel.forEach(async channel => {
        await channel.permissionOverwrites.create(embedRole, {
          EMBED_LINKS: false,
        });
      });

      await member.roles.add(embedRole).catch(console.error);
      wait(milliseconds).then(() => member.roles.remove(embedRole).catch(console.error));
      break; // end

    case 'emoji':
      const emojiRoleTop = guild.roles.cache.find(r => r.name === 'Emoji restricted' && r.permissions.bitfield === 0n);

      if (emojiRoleTop === undefined) {
        await guild.roles
          .create({
            name: 'Emoji restricted',
            color: '#C0C0C0',
            hoist: false,
            position: position,
            permissions: 0n,
            mentionable: false,
          })
          .catch(console.error);
      }

      // had to fetch role again to avoid old results.
      const emojiRole = guild.roles.cache.find(r => r.name === 'Emoji restricted' && r.permissions.bitfield === 0n);

      textChannel.forEach(async channel => {
        await channel.permissionOverwrites.create(emojiRole, {
          USE_EXTERNAL_EMOJIS: false,
        });
      });
      await member.roles.add(emojiRole).catch(console.error);
      wait(milliseconds).then(() => member.roles.remove(emojiRole).catch(console.error));
      break;

    case 'react':
      const reactRoleTop = guild.roles.cache.find(r => r.name === 'React restricted' && r.permissions.bitfield === 0n);

      if (reactRoleTop === undefined) {
        await guild.roles
          .create({
            name: 'React restricted',
            color: '#C0C0C0',
            hoist: false,
            position: position,
            permissions: 0n,
            mentionable: false,
          })
          .catch(console.error);
      }

      // had to fetch role again to avoid old results.
      const reactRole = guild.roles.cache.find(r => r.name === 'React restricted' && r.permissions.bitfield === 0n);

      textChannel.forEach(async channel => {
        await channel.permissionOverwrites.create(reactRole, {
          ADD_REACTIONS: false,
        });
      });
      await member.roles.add(reactRole).catch(console.error);
      wait(milliseconds).then(() => member.roles.remove(reactRole).catch(console.error));
      break;
  }

  // Sending Embeds
  const { modLogChannelID } = await client.bruno.get(`SELECT modLogChannelID FROM guild WHERE guildid = ${guildId}`);
  const modLogs = guild.channels.cache.get(modLogChannelID);
  const owner = guild.ownerId === user.id ? 'Owner' : 'Moderator';

  let data = await client.cases.get(
    `SELECT caseId FROM cases WHERE guildid = ${guildId} ORDER BY caseId DESC LIMIT 1;`,
  );
  const increase = data?.caseid ? ++data.caseid : 1;

  await client.cases.exec(`INSERT INTO cases
  (caseid, guildid, caseaction, reason, moderatorid, moderatortag, targetid, targettag, referenceid)
  VALUES (${increase}, ${guildId}, '${capitalize(action)} restricted', '${reason ?? undefined}', ${user.id}, '${
    user.tag
  }',
  ${member.id}, '${member.user.tag}', '${reference ?? undefined}')`);

  switch (action) {
    case 'embed':
    case 'emoji':
    case 'react':
      await interaction.deferReply({ ephemeral: true });
      await wait(3000);
      await interaction.editReply({
        content: `► \`[${capitalize(action)} Restricted]\`: ${member.user.tag} \`[${member.id}]\``,
      });

      const embed = new MessageEmbed()
        .setAuthor({
          name: `${user.username} (${owner})`,
          iconURL: user.displayAvatarURL(),
        })
        .setColor('#ed174f')
        .setDescription(
          `**${owner}:** \` ${user.tag} \` [${user.id}]
         **Member:** \` ${member.user.tag} \` [${member.id}]
         **Action:** ${capitalize(action)} restricted
         **Action Expiration:** \` ${msToTime} \`
         ${reason ? `**Reason:** ${bigReason}` : ''}
         ${
           reference
             ? `**Reference:** [#${reference}](https://discord.com/channels/${guildId}/${modLogs.id}/${ref?.logMessageId})`
             : ''
         }`,
        )
        .setFooter({ text: `Case ${increase}` })
        .setTimestamp();
      await modLogs
        ?.send({ embeds: [embed] })
        .then(message => client.cases.exec(`UPDATE cases SET logMessageId = ${message.id} WHERE caseid = ${increase}`));
      break;
  }
}
