export const name = 'ready';
export const once = true;
import { Anime, Music } from '../utils/collection.js';
import { randomNoRepeats } from '../utils/functions.js';

export function execute(client) {
  const minutes = randomNoRepeats([720000, 360000, 960000, 480000]); // 12, 6, 16, 8 - minutes
  const hours = randomNoRepeats([1800000, 2700000, 3600000]); // 30, 45, 60 - minutes

  let intervalId;
  setInterval(() => {
    const type = ['WATCHING', 'LISTENING'];
    let ranType = randomNoRepeats(type);

    clearInterval(intervalId);

    setTimeout(() => {
      if (ranType === 'WATCHING') {
        intervalId = setInterval(async () => {
          let ranAnime = randomNoRepeats(Anime);
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
        }, hours); // 30 minutes
      } else {
        intervalId = setInterval(async () => {
          let ranMusic = randomNoRepeats(Music);
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
        }, minutes); // 10 minutes
      }
    });
  }, 43200000); // 12 hours

  console.log(`Ready! Logged in as ${client.user.tag}`);
}
