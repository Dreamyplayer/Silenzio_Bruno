import { SlashCommandBuilder } from '@discordjs/builders';
import { setTimeout as wait } from 'node:timers/promises';

export const data = new SlashCommandBuilder()
  .setName('restrict')
  .setDescription('Restrict a member of this guild/server.')
  .setDefaultPermission(false)
  .addStringOption(option =>
    option
      .setName('commands')
      .setDescription('Select a action to restrict.')
      .setRequired(true)
      .addChoice('Embed', 'embed')
      .addChoice('Emoji', 'emoji')
      .addChoice('React', 'react'),
  );

export async function execute(interaction) {
  const action = interaction.options.getString('commands');
  const textChannel = interaction.guild.channels.cache.map(ch => ch.type === 'GUILD_TEXT' && ch).filter(Boolean);
  const position = interaction.guild.roles.cache.find(r => r.tags.botId === '954977884731240488').position;

  switch (action) {
    case 'embed':
      const embedRole = interaction.guild.roles.cache.find(
        r => r.name === 'Embed restricted' && r.permissions.bitfield === 0n,
      );

      if (embedRole === undefined) {
        await interaction.guild.roles
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
      await interaction.deferReply();
      await wait(3000);
      // had to fetch role again to avoid old results.
      const fetchRole1 = interaction.guild.roles.cache.find(
        r => r.name === 'Embed restricted' && r.permissions.bitfield === 0n,
      );

      // overWrite permissions only to text channels
      textChannel.forEach(async channel => {
        await channel.permissionOverwrites.create(fetchRole1, {
          EMBED_LINKS: false,
        });
      });
      await interaction.member.roles.add(fetchRole1).catch(console.error);
      await interaction.editReply('embed');
      break; // end

    case 'emoji':
      const emojiRole = interaction.guild.roles.cache.find(
        r => r.name === 'Emoji restricted' && r.permissions.bitfield === 0n,
      );

      if (emojiRole === undefined) {
        await interaction.guild.roles
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

      await interaction.deferReply();
      await wait(3000);
      // had to fetch role again to avoid old results.
      const fetchRole2 = interaction.guild.roles.cache.find(
        r => r.name === 'React restricted' && r.permissions.bitfield === 0n,
      );

      textChannel.forEach(async channel => {
        await channel.permissionOverwrites.create(fetchRole2, {
          ADD_REACTIONS: false,
        });
      });
      await interaction.member.roles.add(fetchRole2).catch(console.error);
      await interaction.editReply('Emoji');
      break;

    case 'react':
      const reactRole = interaction.guild.roles.cache.find(
        r => r.name === 'React restricted' && r.permissions.bitfield === 0n,
      );

      if (reactRole === undefined) {
        await interaction.guild.roles
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

      await interaction.deferReply();
      await wait(3000);
      // had to fetch role again to avoid old results.
      const fetchRole = interaction.guild.roles.cache.find(
        r => r.name === 'React restricted' && r.permissions.bitfield === 0n,
      );

      textChannel.forEach(async channel => {
        await channel.permissionOverwrites.create(fetchRole, {
          ADD_REACTIONS: false,
        });
      });
      await interaction.member.roles.add(fetchRole).catch(console.error);
      await interaction.editReply('React');
      break;
  }
  // if (action === 'embed') {
  //   const embedRole = interaction.guild.roles.cache.find(
  //     r => r.name === 'Embed restricted' && r.permissions.bitfield === 0n,
  //   );

  //   const position = interaction.guild.roles.cache.find(r => r.tags.botId === '954977884731240488').position;

  //   if (embedRole === undefined) {
  //     await interaction.guild.roles
  //       .create({
  //         name: 'Embed restricted',
  //         color: '#C0C0C0',
  //         hoist: false,
  //         position: position,
  //         permissions: 0n,
  //         mentionable: false,
  //       })
  //       .catch(console.error);
  //   }
  //   await interaction.deferReply();
  //   await wait(3000);
  //   // had to fetch role again to avoid old results.
  //   const fetchRole = interaction.guild.roles.cache.find(
  //     r => r.name === 'Embed restricted' && r.permissions.bitfield === 0n,
  //   );
  //   textChannel.forEach(async channel => {
  //     await channel.permissionOverwrites.create(fetchRole, {
  //       EMBED_LINKS: false,
  //     });
  //   });
  //   await interaction.member.roles.add(fetchRole).catch(console.error);
  //   await interaction.editReply('embed');
  // } else if (action === 'emoji') {
  //   await interaction.reply('sdasd');
  // } else if (action === 'react') {
  //   const reactRole = interaction.guild.roles.cache.find(
  //     r => r.name === 'React restricted' && r.permissions.bitfield === 0n,
  //   );

  //   const position = interaction.guild.roles.cache.find(r => r.tags.botId === '954977884731240488').position;

  //   if (reactRole === undefined) {
  //     await interaction.guild.roles
  //       .create({
  //         name: 'React restricted',
  //         color: '#C0C0C0',
  //         hoist: false,
  //         position: position,
  //         permissions: 0n,
  //         mentionable: false,
  //       })
  //       .catch(console.error);
  //   }

  //   await interaction.deferReply();
  //   await wait(3000);
  //   // had to fetch role again to avoid old results.
  //   const fetchRole = interaction.guild.roles.cache.find(
  //     r => r.name === 'React restricted' && r.permissions.bitfield === 0n,
  //   );

  //   textChannel.forEach(async channel => {
  //     await channel.permissionOverwrites.create(fetchRole, {
  //       ADD_REACTIONS: false,
  //     });
  //   });
  //   await interaction.member.roles.add(fetchRole).catch(console.error);
  //   await interaction.editReply('React');
  // }
}
