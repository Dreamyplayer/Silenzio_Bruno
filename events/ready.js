export const name = 'ready';
export const once = true;
export function execute(client) {
  let guilds = client.guilds.cache.map(g => g.name);
  // let randomServer = guilds[Math.floor(guilds.length * Math.random())];

  // setInterval(async () => {
  client.user
    .setPresence({
      status: 'Online',
      activity: {
        name: guilds,
        type: 'WATCHING',
        url: 'https://discord.gg/V8guWsR',
      },
    })
    .then(console.log)
    .catch(console.error);
  // }, 3600000); // 1 Hour

  console.log(`Ready! Logged in as ${client.user.tag}`);
}
