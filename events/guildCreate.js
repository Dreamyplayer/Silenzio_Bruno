export const name = 'guildCreate';

export async function execute(guild) {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
}
