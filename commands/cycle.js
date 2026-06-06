const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const allowedRoles = [
    '1507820452641509496'
];

const LOG_FILE = './tasklogs.json';

module.exports = {

    data: new SlashCommandBuilder()
        .setName('startcycle')
        .setDescription('Reset all task logs'),

    async execute(interaction) {

        const hasRole =
            interaction.member.roles.cache.some(r =>
                allowedRoles.includes(r.id)
            );

        if (!hasRole) {

            return interaction.reply({
                content:
                'You cannot reset logs.',
                ephemeral: true
            });
        }

        fs.writeFileSync(
            LOG_FILE,
            '{}'
        );

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Cycle Started')
            .setDescription(
                'All task logs have been reset.'
            );

        await interaction.reply({
            embeds: [embed]
        });
    }
};
