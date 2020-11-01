import { Client, Message, MessageEmbed } from 'discord.js';
import PostgreSQL from '../structures/PostgreSQL';

import { botCache } from '../app';

botCache.commands.set('list', {
    helpMessage: 'Obtain a list of all active suggestions.',
    exec: async (client: Client, message: Message, language: any) => {
        PostgreSQL.query('SELECT id, context, author, guild, channel, message FROM suggestions WHERE guild = $1::text AND status = $2::text', [message.guild.id, 'Open'], (error, result) => {
            if (error || !result.rows.length) {
                message.channel.send({
                    embed: new MessageEmbed()
                        .setAuthor(language.errorTitle, client.user.avatarURL())
                        .setColor(process.env.EMBED_COLOR)
                        .setDescription(language.commands.list.noSuggestions)
                        .setTimestamp()
                        .setFooter(process.env.EMBED_FOOTER)
                });
                return;
            }

            const listEmbed = new MessageEmbed()
                .setAuthor(language.commands.list.title, client.user.avatarURL())
                .setColor(process.env.EMBED_COLOR)
                .setDescription(language.commands.list.description)
                .setTimestamp()
                .setFooter(process.env.EMBED_FOOTER);

            for (let i = 0; i < result.rows.length; i++) {
                if (i === 9) {
                    break;
                }
                const user = message.guild.members.cache.get(result.rows[i].author) ?
                    message.guild.members.cache.get(result.rows[i].author).user.tag :
                    "User Left ~ Suggestions";

                listEmbed.addField(user,
                    language.commands.list.suggestionDescription
                        .replace(/<Description>/g, result.rows[i].context)
                        .replace(/<ID>/g, result.rows[i].id)
                        .replace(/<Url>/g, `https://canary.discordapp.com/channels/${result.rows[i].guild}/${result.rows[i].channel}/${result.rows[i].message}`),
                    false);
            }
            message.channel.send({ embed: listEmbed });
        });
    }
});
