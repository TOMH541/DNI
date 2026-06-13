const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const allowedRoles = [
    '1515450853719277598' // People who can punish staff
];

const strikeRole = '1515452574810116306';
const blacklistRole = '1515452679034503292';
const warningRole = '1515452739625418814';

module.exports = {

    data: new SlashCommandBuilder()

        .setName('punishstaff')

        .setDescription('Punish a staff member')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to punish')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('punishment')
                .setDescription('Punishment type')
                .setRequired(true)

                .addChoices(
                    {
                        name: 'Staff Strike',
                        value: 'strike'
                    },
                    {
                        name: 'Blacklist',
                        value: 'blacklist'
                    },
                    {
                        name: 'Removal',
                        value: 'removal'
                    },
                    {
                        name: 'Staff Warning',
                        value: 'warning'
                    }
                )
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for punishment')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Duration (Example: 14d)')
                .setRequired(true)
        ),

    async execute(interaction) {

        const hasRole =
            interaction.member.roles.cache.some(role =>
                allowedRoles.includes(role.id)
            );

        if (!hasRole) {

            return interaction.reply({
                content: 'You cannot use this command.',
                ephemeral: true
            });
        }

        const user =
            interaction.options.getUser('user');

        const punishment =
            interaction.options.getString('punishment');

        const reason =
            interaction.options.getString('reason');

        const duration =
            interaction.options.getString('duration');

        const member =
            await interaction.guild.members.fetch(user.id);

        let color = 'Yellow';
        let title = '';
        let description = '';

        if (punishment === 'warning') {

            color = 'Yellow';

            title =
                '⚠️ You Have Received a Staff Warning';

            description =
                'You have been issued a Staff warning.';

            await member.roles.add(warningRole);
        }

        if (punishment === 'strike') {

            color = 'Orange';

            title =
                '⚠️ You Have Received a Staff Strike';

            description =
                'You have been issued a Staff strike.';

            await member.roles.add(strikeRole);
        }

        if (punishment === 'blacklist') {

            color = 'DarkRed';

            title =
                '⛔ You Have Been Blacklisted';

            description =
                'You have been blacklisted from Staff.';

            await member.roles.add(blacklistRole);
        }

        if (punishment === 'removal') {

            color = 'Red';

            title =
                '❌ You Have Been Removed from Staff';

            description =
                'You have been removed from the Staff team.';
        }

        const dmEmbed = new EmbedBuilder()

            .setColor(color)

            .setTitle(title)

            .setDescription(description)

            .addFields(

                {
                    name: '📝 Reason',
                    value: reason,
                    inline: false
                },

                {
                    name: '⏱️ Duration',
                    value: duration,
                    inline: true
                },

                {
                    name: '📅 Expires',
                    value: `In ${duration}`,
                    inline: true
                },

                {
                    name: '👮 Punished By',
                    value: `${interaction.user}`,
                    inline: false
                }
            )

            .setTimestamp();

        try {

            await user.send({
                embeds: [dmEmbed]
            });

        } catch {

            console.log(
                `Could not DM ${user.tag}.`
            );
        }

        await interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor('Green')

                    .setTitle(
                        '✅ Staff Punishment Issued'
                    )

                    .setDescription(

                        `Successfully issued **${punishment}** to ${user}.`
                    )

                    .addFields(

                        {
                            name: 'Reason',
                            value: reason,
                            inline: false
                        },

                        {
                            name: 'Duration',
                            value: duration,
                            inline: true
                        },

                        {
                            name: 'Punished By',
                            value: `${interaction.user}`,
                            inline: true
                        }
                    )
            ]
        });
    }
};
