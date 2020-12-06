import botCache from '../../structures/BotCache';
import { getChannelFromArgs, Permission, sendPlainEmbed } from '../../managers/Commands';
import { log } from '../../structures/Logging';
import { getSuggestionData, moveSuggestion, SuggestionStatus } from '../../managers/Suggestions';

botCache.commands.set('movesuggestion', {
    enabled: true,
    permission: Permission.STAFF,
    exec: async (client, message, commandData, args) => {
        if (args.length !== 2) {
            await sendPlainEmbed(message.channel, botCache.config.colors.red, commandData.language.movesuggestion.helpDescription.replace('%prefix%', commandData.prefix));
            return;
        }

        let suggestion = await getSuggestionData(args[0]);
        if (suggestion == null || suggestion.status === SuggestionStatus.DELETED as number) {
            await sendPlainEmbed(message.channel, botCache.config.colors.red, commandData.language.movesuggestion.invalidSuggestion
                + "\n\n(**Note:** If an existing message won't approve then it could be caused by the transfer from v3.5.0 to v4.0.0. We were forced to remove all current suggestions and reports from our database. You can safely delete the message and create a new one. Sorry for the inconvenience)"
            );
            return;
        }

        let channel = await getChannelFromArgs(message.guild, args[1]);
        if (!channel) {
            await sendPlainEmbed(message.channel, botCache.config.colors.red, commandData.language.movesuggestion.invalidChannel);
            return;
        }

        await moveSuggestion(message, commandData.language, suggestion, channel);

        await sendPlainEmbed(message.channel, botCache.config.colors.green, commandData.language.movesuggestion.locationUpdated);
        await log(message.guild, commandData.language.logs.suggestionMoved.replace('%user_tag%', message.author.tag).replace('%suggestion_id%', String(suggestion.id).replace('%channel%', channel.name)));
    }
});