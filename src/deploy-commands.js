// bot/src/deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'archive',
        description: 'Archives your highlight to the web gallery.',
        options: [
            {
                name: 'game',
                type: 3, // String
                description: 'The game associated with the highlight (e.g., valorant)',
                required: true,
            },
            {
                name: 'tags',
                type: 3, // String
                description: 'Comma-separated tags for the highlight (e.g., epic,clutch)',
                required: true,
            },
            {
                name: 'content',
                type: 3, // String
                description: 'Optional additional message content for the highlight',
                required: false,
            },
        ],
    },
    // เราจะเพิ่ม /view, /delete, /edit ที่นี่ในอนาคต
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();