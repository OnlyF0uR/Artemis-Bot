import { Client, Guild, Collection, TextChannel } from 'discord.js';
import PostgreSQL from '../structures/PostgreSQL';
import cache from 'memory-cache';
import cliColors from '../structures/CLIColors';
import utf8 from 'utf8';
import Utils from '../structures/Utils';
import DBL from 'dblapi.js';

import ApproveController from '../controllers/assessments/Approve';
import RejectController from '../controllers/assessments/Approve';

const utils: Utils = new Utils();

export default async (client: Client) => {
    const pgClient = new PostgreSQL().getClient();

    await pgClient.connect();

    // TODO: See todo.txt line: 1

    const result = await pgClient.query('SELECT * FROM servers');

    /*
     * Memory Management
     */
    if (result.rows.length) {
        for (let i = 0; i < result.rows.length; i++) {
            cache.put(result.rows[i].id, {
                prefix: utf8.decode(result.rows[i].prefix),
                language: result.rows[i].language,
                channel: result.rows[i].channel,
                auto_approve: result.rows[i].auto_approve,
                auto_reject: result.rows[i].auto_reject,
                delete_approved: result.rows[i].delete_approved,
                delete_rejected: result.rows[i].delete_rejected
            });
        }
    }

    const uncachedServers: Collection<string, Guild> = client.guilds.cache.filter(server => cache.get(server.id) === null);

    for (let key of Array.from(uncachedServers.keys())) {
        const serverId = uncachedServers.get(key).id;

        await pgClient.query('INSERT INTO servers (id, prefix, language) VALUES ($1::text, $2::text, $3::text)', [serverId, process.env.COMMAND_PREFIX, process.env.DEFAULT_LANGUAGE]);

        cache.put(serverId, {
            prefix: process.env.COMMAND_PREFIX,
            language: process.env.DEFAULT_LANGUAGE,
            channel: null as any,
            auto_approve: null as any,
            auto_reject: null as any,
            delete_approved: null as any,
            delete_rejected: null as any
        });

    }

    const res = await pgClient.query('SELECT channel, message FROM suggestions');
    if (res.rows.length) {
        for (let i = 0; i < res.rows.length; i++) {
            const channel = client.channels.cache.get(res.rows[i].channel) as TextChannel;
            const message = await channel.messages.fetch(res.rows[i].message);

            const currentCache = cache.get(channel.guild.id);

            const reactionAmount = message.reactions.cache.size - 1;

            if (currentCache.auto_approve >= reactionAmount)
                ApproveController(client, message, utils.languageCodeToObject(currentCache.language));

            if (currentCache.auto_reject >= reactionAmount)
                RejectController(client, message, utils.languageCodeToObject(currentCache.language));
        }
    }

    await pgClient.end();

    // Api part
    const dbl = new DBL(process.env.APIS_DBL_TOKEN, client);
    setInterval(async () => {
        const res = await client.shard.fetchClientValues('guilds.cache.size');
        const shard_id = await client.shard.broadcastEval('this.guilds.cache.first().shardID');
        dbl.postStats(
            res.reduce((prev, guildCount) => prev + guildCount, 0),
            shard_id[0],
            client.shard.count
        );
    }, 1800000);

    console.log(cliColors.FgBlue + "\n---=[Succesfully enabled the bot!]=---" + cliColors.Reset);

}
