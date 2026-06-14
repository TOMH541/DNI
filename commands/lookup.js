const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const allowedRoles = [
    '1515450853719277598'
];

const dbPath = './data/punishments.json';

module.exports = {

    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('View a user\'s punishment history.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to lookup')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('daterange')
                .setDescription('How many days back to search (default: 7)')
                .setMinValue(1)
                .setMaxValue(365)
                .setRequired(false)
        ),

    async execute(interaction) {

        const hasRole = interaction.member.roles.cache.some(role =>
            allowedRoles.includes(role.id)
        );

        if (!hasRole) {
            return interaction.reply({
                content: 'You cannot use this command.',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const dateRange =
            interaction.options.getInteger('daterange') || 7;

        let db = {};

        if (fs.existsSync(dbPath)) {
            try {
                db = JSON.parse(
                    fs.readFileSync(dbPath, 'utf8')
                );
            } catch {
                db = {};
            }
        }

        const cutoff =
            Date.now() - (dateRange * 24 * 60 * 60 * 1000);

        const warnings = [];
        const timeouts = [];
        const bans = [];

        Object.entries(db).forEach(([caseId, data]) => {

            if (data.userId !== user.id) return;

            if (!data.timestamp) return;

            if (data.timestamp < cutoff) return;

            const daysAgo =
                Math.floor(
                    (Date.now() - data.timestamp) /
                    (1000 * 60 * 60 * 24)
                );

            const moderator =
                data.moderatorId
                    ? `<@${data.moderatorId}>`
                    : 'Unknown';

            const entry =
                `• ${data.reason}\n` +
                `(${daysAgo} day(s) ago) By ${moderator}`;

            if (data.type === 'warning') {
                warnings.push(entry);
            }

            if (data.type === 'timeout') {
                timeouts.push(entry);
            }

            if (data.type === 'ban') {
                bans.push(entry);
            }
        });

        let standing = 'Good Standing';

        if (bans.length > 0) {
            standing = 'Banned';
        } else if (timeouts.length >= 2) {
            standing = 'Poor Standing';
        } else if (
            warnings.length >= 3 ||
            timeouts.length >= 1
        ) {
            standing = 'Needs Review';
        }

        const embed = new EmbedBuilder()

            .setColor('Blue')

            .setTitle('🔎 User Lookup')

            .setThumbnail(
                user.displayAvatarURL({
                    size: 1024
                })
            )

            .addFields(

                {
                    name: '👤 User',
                    value: `${user.tag}\n(${user.id})`,
                    inline: false
                },

                {
                    name: '📋 Account Standing',
                    value: standing,
                    inline: false
                },

                {
                    name: `⚠️ Warnings (${warnings.length})`,
                    value:
                        warnings.length > 0
                            ? warnings.join('\n\n')
                            : 'None in selected timeframe.',
                    inline: false
                },

                {
                    name: `⏳ Timeouts (${timeouts.length})`,
                    value:
                        timeouts.length > 0
                            ? timeouts.join('\n\n')
                            : 'None in selected timeframe.',
                    inline: false
                },

                {
                    name: `🔨 Bans (${bans.length})`,
                    value:
                        bans.length > 0
                            ? bans.join('\n\n')
                            : 'None in selected timeframe.',
                    inline: false
                }
            )

            .setFooter({
                text:
                    `Showing the past ${dateRange} day(s)`
            })

            .setTimestamp();

        await interaction.reply({

            embeds: [embed],

            ephemeral: true
        });
    }
};
