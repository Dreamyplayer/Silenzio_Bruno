export const name = 'guildCreate';

export async function execute(guild) {
  const client = guild.client;

  client.db.set(`BOT_${guild.id}`, {
    prefix: '|',
  });

  client.db.set(`settings_${guild.id}`, {
    emoji_spawn: true,
    YouTube_Links: true,
    Discord_Links: true,
    modLogChannelID: 'mod-logs',
    MuteRoleID: 'Moderator',
  });

  client.db.set(`BANS_`, {});
}
