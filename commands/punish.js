const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const allowedRoles = [
    'ROLE_ID_HERE'
];

const strikeRole = 'STRIKE_ROLE_ID';
const blacklistRole = 'BLACKLIST_ROLE_ID';
const warningRole = 'WARNING_ROLE_ID';

module.exports = {

    data: new SlashCommandBuilder()

        .setName('commandpunish')

        .setDescription('Punish a user')

        .addUserOption(option =>
            option
            .setName('user')
            .setDescription('User')
            .setRequired(true)
        )

        .addStringOption(option =>
            option
            .setName('punishment')
            .setDescription('Punishment type')
            .setRequired(true)

            .addChoices(
                { name: 'Strike', value: 'strike' },
                { name: 'Blacklist', value: 'blacklist' },
                { name: 'Removal', value: 'removal' },
                { name: 'Warning', value: 'warning' }
            )
        )

        .addStringOption(option =>
            option
            .setName('reason')
            .setDescription('Reason')
            .setRequired(true)
        )

        .addStringOption(option =>
            option
            .setName('duration')
            .setDescription('Duration Example: 14d')
            .setRequired(true)
        ),

    async execute(interaction) {

        const hasRole =
        interaction.member.roles.cache.some(r =>
            allowedRoles.includes(r.id)
        );

        if (!hasRole) {

            return interaction.reply({
                content:
                'You cannot use this command.',
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

            title =
            '⚠️ You Have Received a Warning';

            description =
            'You have been issued a warning.';

            await member.roles.add(warningRole);
        }

        if (punishment === 'strike') {

            color = 'Orange';

            title =
            '⚠️ You Have Received a Staff Strike';

            description =
            'You have been issued a staff strike.';

            await member.roles.add(strikeRole);
        }

        if (punishment === 'blacklist') {

            color = 'DarkRed';

            title =
            '⛔ You Have Been Blacklisted';

            description =
            'You have been blacklisted from staff.';
            
            await member.roles.add(blacklistRole);
        }

        if (punishment === 'removal') {

            color = 'Red';

            title =
            '❌ You Have Been Removed from Staff';

            description =
            'You have been removed from the staff team.';
        }

        const embed = new EmbedBuilder()

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
                }
            )

            .setTimestamp();

        try {

            await user.send({
                embeds: [embed]
            });

        } catch {

            console.log('Could not DM user.');
        }

        await interaction.reply({

            embeds: [

                new EmbedBuilder()

                .setColor('Green')

                .setDescription(
                    `Successfully issued **${punishment}** to ${user}.`
                )
            ]
        });
    }
};
