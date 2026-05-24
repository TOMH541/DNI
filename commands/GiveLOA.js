const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const allowedRoles = [
    '1507820452641509496'
];

const loaRole = '1507157071655866439';

module.exports = {

    data: new SlashCommandBuilder()

        .setName('giveloa')

        .setDescription('Give a user LOA')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Example: 7d')
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

        const duration =
        interaction.options.getString('duration');

        const member =
        await interaction.guild.members.fetch(user.id);

        await member.roles.add(loaRole);

        const dmEmbed = new EmbedBuilder()

            .setColor('Blue')

            .setTitle('🛫 Leave of Absence Granted')

            .setDescription(
                'You have been placed on Leave of Absence.'
            )

            .addFields(

                {
                    name: '📆 Duration',
                    value: duration,
                    inline: true
                },

                {
                    name: '👮 Granted By',
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

            console.log('Could not DM user.');
        }

        const successEmbed = new EmbedBuilder()

            .setColor('Green')

            .setDescription(
                `Successfully gave LOA to ${user} for **${duration}**.`
            );

        await interaction.reply({

            embeds: [successEmbed]
        });
    }
};
