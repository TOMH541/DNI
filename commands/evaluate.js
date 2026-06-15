// commands/evaluate.js

const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const EVALUATOR_ROLE = '1515133506852749493';
const REQUIRED_LOGS = 3;

module.exports = {

    data: new SlashCommandBuilder()

        .setName('evaluate')

        .setDescription(
            'Evaluate a Trial Moderator for promotion eligibility.'
        )

        .addUserOption(option =>
            option

                .setName('user')

                .setDescription(
                    'Trial Moderator to evaluate'
                )

                .setRequired(true)
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

        const user =
            interaction.options.getUser('user');

        const member =
            await interaction.guild.members
                .fetch(user.id)
                .catch(() => null);

        if (!member) {

            return interaction.reply({

                content:
                    '❌ User not found.',

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

        const count =
            logs[user.id] || 0;

        const eligible =
            count >= REQUIRED_LOGS;

        const embed =
            new EmbedBuilder()

                .setColor(
                    eligible
                        ? 'Green'
                        : 'Red'
                )

                .setTitle(
                    'Trial Moderator Evaluation'
                )

                .setThumbnail(
                    user.displayAvatarURL({
                        dynamic: true
                    })
                )

                .addFields(

                    {
                        name: 'User',

                        value: `${user}`,

                        inline: false
                    },

                    {
                        name:
                            'Logs This Cycle',

                        value:
                            `${count} / ${REQUIRED_LOGS}`,

                        inline: true
                    },

                    {
                        name:
                            'Promotion Status',

                        value:
                            eligible
                                ? '✅ Eligible'
                                : '❌ Not Eligible',

                        inline: true
                    }
                )

                .setFooter({

                    text:
                        `Evaluated by ${interaction.user.username}`
                })

                .setTimestamp();

        await interaction.reply({

            embeds: [embed]
        });
    }
};
