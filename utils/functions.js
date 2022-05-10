import fetch from 'cross-fetch';
import { createHash } from 'crypto';
import { config } from 'dotenv';
config();

export const createContentHash = content => {
  return createHash('md5').update(content.toLowerCase()).digest('hex');
};

export const randomNoRepeats = arr => {
  let copy = arr.slice(0);
  return (() => {
    if (copy.length < 1) {
      copy = arr.slice(0);
    }
    let index = Math.floor(Math.random() * copy.length);
    let item = copy[index];
    copy.splice(index, 1);
    return item;
  })();
};

export const numberFormatter = (num, digits) => {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(item => {
      return num >= item.value;
    });
  return item ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol : '0';
};

export const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

// API Fetching Collections
const res =
  process.env.START === false
    ? await fetch(`${process.env.base_URL}/collections/anime`, {
        headers: {
          'API-Key': `${process.env.API_KEY}`,
        },
      }).catch(console.error)
    : 'API Not Running';

const dataA = process.env.START === false ? await res?.json() : 'API Not Running';

const response =
  process.env.START === false
    ? await fetch(`${process.env.base_URL}/collections/music`, {
        headers: {
          'API-Key': `${process.env.API_KEY}`,
        },
      }).catch(console.error)
    : 'API Not Running';

const dataM = process.env.START === false ? await response?.json() : 'API Not Running';

export const anime = dataA?.Anime === undefined ? 'No anime found' : randomNoRepeats(dataA?.Anime);
export const music = dataM?.Music === undefined ? 'No music found' : randomNoRepeats(dataM?.Music);

// export const embedCreate = (
//   { name: author, iconURL: iconURL },
//   { color: color },
//   { description: description },
//   { text: footer },
// ) => {
//   const embed = new MessageEmbed()
//     .setAuthor({ name: author, iconURL: iconURL })
//     .setColor(color)
//     .setDescription(description)
//     .setFooter({ text: footer })
//     .setTimestamp();

//   return embed;
// };
// import translator from '@vitalets/google-translate-api';

// export const translate = async (str, lang) => {
//   const res = await translator(str, { to: lang });
//   return res;
// };
