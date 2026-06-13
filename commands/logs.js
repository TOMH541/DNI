const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const allowedRoles = [
    '1515450853719277598'
];

const LOG_FILE = './tasklogs.json';

module.exports = {

    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('View task logs'),

    async execute(interaction) {

        const hasRole =
            interaction.member.roles.cache.some(r =>
                allowedRoles.includes(r.id)
            );

        if (!hasRole) {

            return interaction.reply({
                content:
                'You cannot view logs.',
                ephemeral: true
            });
        }

        let data = {};

        if (fs.existsSync(LOG_FILE)) {

            data = JSON.parse(
                fs.readFileSync(LOG_FILE)
            );
        }

        let description = '';

        for (const userId in data) {

            description +=
                `<@${userId}> - ${data[userId]} logs\n`;
        }

        if (!description)
            description = 'No logs found.';

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('Task Logs')
            .setDescription(description);

        await interaction.reply({
            embeds: [embed]
        });
    }
};
