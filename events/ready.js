import { anime, music, randomNoRepeats } from '../utils/functions.js';

export const name = 'ready';
export const once = true;
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
          await client.user.setPresence({
            status: 'dnd',
            activities: [
              {
                name: `📽️ ${anime}`,
                type: 'WATCHING',
                url: 'https://discord.gg/V8guWsR',
              },
            ],
          });
        }, hours); // 30 minutes
      } else {
        intervalId = setInterval(async () => {
          await client.user.setPresence({
            status: 'dnd',
            activities: [
              {
                name: `🎧 ${music}`,
                type: 'LISTENING',
                url: 'https://discord.gg/V8guWsR',
              },
            ],
          });
        }, minutes); // 10 minutes
      }
    });
  }, 43200000); // 12 hours

  console.log(`Ready! Logged in as ${client.user.tag}`);
}
