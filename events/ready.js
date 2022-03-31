export const name = 'ready';
export const once = true;
import { Anime, Music } from '../collection.js';
import { randomNoRepeats } from '../utils/functions.js';

export function execute(client) {
  let intervalId;
  setInterval(() => {
    const type = ['WATCHING', 'LISTENING'];
    let ranType = randomNoRepeats(type)();

    clearInterval(intervalId);

    setTimeout(() => {
      if (ranType === 'WATCHING') {
        intervalId = setInterval(async () => {
          let ranAnime = randomNoRepeats(Anime)();
          await client.user.setPresence({
            status: 'dnd',
            activities: [
              {
                name: `📽️ ${ranAnime}`,
                type: 'WATCHING',
                url: 'https://discord.gg/V8guWsR',
              },
            ],
          });
          console.log(`Watching ${ranAnime}`);
        }, 1800000); // 30 minutes
      } else {
        intervalId = setInterval(async () => {
          let ranMusic = randomNoRepeats(Music)();
          await client.user.setPresence({
            status: 'dnd',
            activities: [
              {
                name: `🎧 ${ranMusic}`,
                type: 'LISTENING',
                url: 'https://discord.gg/V8guWsR',
              },
            ],
          });
          console.log(`Listening to ${ranMusic}`);
        }, 600000); // 10 minutes
      }
    });
  }, 43200000); // 12 hours

  console.log(`Ready! Logged in as ${client.user.tag}`);
}
