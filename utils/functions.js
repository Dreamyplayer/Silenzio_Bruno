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

// import translator from '@vitalets/google-translate-api';

// export const translate = async (str, lang) => {
//   const res = await translator(str, { to: lang });
//   return res;
// };
