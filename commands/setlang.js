import { MessageEmbed } from 'discord.js';
import { getkey, langs } from '../utils/langs.js';
import { setLangCommand } from './interactions/commands.js';

export const data = setLangCommand;

export async function execute(interaction) {
  const { options, client, guildId, user } = interaction;
  const picked = options.getString('options');
  const selectedLang = options.getString('lang');
  const precise = client.emojis.cache.get('970397401045139486');
  const erroneous = client.emojis.cache.get('970397421697912963');

  const langConvert = getkey(selectedLang ?? 'english');

  if (picked === 'list' && selectedLang !== null) {
    return interaction.reply({
      content: `${erroneous} Don't select \`lang\` option: To get list of Supported Languages`,
      ephemeral: true,
    });
  }

  if (langConvert === undefined) {
    return interaction.reply({
      content: `${erroneous} **Invalid language || case-sensitive:** check the spelling again.`,
      ephemeral: true,
    });
  }

  switch (picked) {
    case 'list':
      const langsEmbed = new MessageEmbed()
        .setColor('BLUE')
        .setTitle(`List of Supported Languages`)
        .setDescription(langs)
        .setTimestamp();

      interaction.reply({ embeds: [langsEmbed], ephemeral: true });

      break;
    case 'user':
      const userData = await client.bruno.get(
        `SELECT guildid, userid, langs FROM language WHERE userid = '${user.id}'`,
      );

      if (userData?.userid === undefined) {
        await client.bruno.exec(`INSERT INTO language (userid, langs) VALUES ('${user.id}', '${langConvert}')`);
      } else if (userData?.userid === null) {
        await client.bruno.exec(`UPDATE language SET langs = '${langConvert}' WHERE userid = '${user.id}'`);
      } else {
        await client.bruno.exec(`UPDATE language SET langs = '${langConvert}' WHERE userid = '${user.id}'`);
      }

      interaction.reply({
        content: `${precise} Language ${
          userData?.userid === undefined ? 'set' : 'updated'
        } to **\`${selectedLang}\`** \n↳ User`,
        ephemeral: true,
      });
      break;
    case 'guild':
      const guildData = await client.bruno.get(
        `SELECT guildid, userid, langs FROM language WHERE guildid = '${guildId}'`,
      );

      if (guildData?.guildid === undefined) {
        await client.bruno.exec(`INSERT INTO language (guildid, langs) VALUES ('${guildId}', '${langConvert}')`);
      } else if (guildData?.guildid === null) {
        await client.bruno.exec(`UPDATE language SET langs = '${langConvert}' WHERE guildid = '${guildId}'`);
      } else {
        await client.bruno.exec(`UPDATE language SET langs = '${langConvert}' WHERE guildid = '${guildId}'`);
      }

      interaction.reply({
        content: `${precise} Language ${
          userData?.guildid === undefined ? 'set' : 'updated'
        } to **\`${selectedLang}\`** \n↳ Guild/Server`,
        ephemeral: true,
      });
      break;
  }
}
