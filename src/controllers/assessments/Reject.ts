import { Client, Message, MessageEmbed } from 'discord.js';

import PostgreSQL from '../../structures/PostgreSQL';
import { get } from '../../structures/CacheManager';

import DeleteController from './Delete';

/*
 msg -> The suggestion message
*/
export default async (client: Client, msg: Message, language: any): Promise<void> => {

	PostgreSQL.query('SELECT id, context, author, status FROM suggestions WHERE message = $1::text', [msg.id], async (error, result) => {
		if (error || !result.rows.length) {
			return;
		}
		const deleteRejected = await get(msg.guild.id, 'delete_rejected') as boolean;
		if (deleteRejected) {
			await DeleteController(msg);
		} else {
			let member = null;
			let picture = null;
			try {
				member = await msg.guild.members.fetch(result.rows[0].author);
			} catch(ex) {
				// Log error if the error is not a Unknown Member
				if (ex.code !== 10007) {
					console.error(ex);
				}
			} finally {
				if (member == null) {
					picture = client.user.avatarURL();
					member = "User Left ~ Suggestions";
				} else {
					// Set picture first
					picture = member.user.avatarURL();
					member = member.user.tag;
				}  
			}

			await msg.edit({
				embed: new MessageEmbed()
					.setAuthor(member, picture)
					.setColor(process.env.REJECTED_EMBED_COLOR)
					.setDescription(language.commands.suggest.description
						.replace(/<Description>/g, result.rows[0].context)
						.replace(/<Status>/g, language.suggestions.rejected)
						.replace(/<ID>/g, result.rows[0].id)
					)
					.setTimestamp()
					.setFooter(process.env.EMBED_FOOTER)
			});

			PostgreSQL.query('UPDATE suggestions SET status = $1::text WHERE message = $2::text', ['Rejected', msg.id]);
		}
	});

}
