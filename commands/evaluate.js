// commands/evaluate.js

const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const EVALUATOR_ROLE = '1515133506852749493';

module.exports = {

    data: new SlashCommandBuilder()

        .setName('evaluate')

        .setDescription(
            'View everyone\'s logs for the current cycle.'
        ),

    async execute(interaction) {

        const hasRole =
            interaction.member.roles.cache.has(
                EVALUATOR_ROLE
            );

        if (!hasRole) {

            return interaction.reply({

                content:
                    '❌ You cannot use this command.',

                ephemeral: true
            });
        }

        let logs = {};

        if (fs.existsSync('./tasklogs.json')) {

            try {

                logs = JSON.parse(

                    fs.readFileSync(
                        './tasklogs.json',
                        'utf8'
                    )
                );

            } catch {

                logs = {};
            }
        }

        if (Object.keys(logs).length === 0) {

            return interaction.reply({

                content:
                    '❌ No logs have been recorded this cycle.',

                ephemeral: true
            });
        }

        const sortedLogs =
            Object.entries(logs)
                .sort((a, b) => b[1] - a[1]);

        let description = '';

        for (const [userId, count] of sortedLogs) {

            description +=
                `<@${userId}> • **${count} logs**\n`;
        }

        const embed =
            new EmbedBuilder()

                .setColor('Blue')

                .setTitle(
                    'Current Cycle Logs'
                )

                .setDescription(
                    description
                )

                .setFooter({

                    text:
                        `Total Staff Logged: ${sortedLogs.length}`
                })

                .setTimestamp();

        await interaction.reply({

            embeds: [embed]
        });
    }
};
