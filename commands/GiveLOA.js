const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const allowedRoles = [
    '1515436572185591868'
];

const loaRole = '1515452170395324456';

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

        // Prevents Unknown Interaction Error
        await interaction.deferReply();

        const hasRole =
        interaction.member.roles.cache.some(r =>
            allowedRoles.includes(r.id)
        );

        if (!hasRole) {

            return interaction.editReply({

                content:
                'You cannot use this command.'
            });
        }

        const user =
        interaction.options.getUser('user');

        const duration =
        interaction.options.getString('duration');

        const member =
        await interaction.guild.members.fetch(user.id);

        // Give LOA Role
        await member.roles.add(loaRole);

        // DM Embed
        const dmEmbed = new EmbedBuilder()

            .setColor('Blue')

            .setTitle('🛫 Leave of Absence Granted')

            .setDescription(
                'You have officially been placed on LOA.'
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
                    inline: true
                }
            )

            .setTimestamp();

        // Attempt DM
        try {

            await user.send({
                embeds: [dmEmbed]
            });

        } catch {

            console.log(
                `Could not DM ${user.tag}`
            );
        }

        // Success Embed
        const successEmbed = new EmbedBuilder()

            .setColor('Green')

            .setTitle('✅ LOA Granted')

            .setDescription(
                `${user} has been placed on LOA for **${duration}**.`
            )

            .addFields(

                {
                    name: '👮 Granted By',
                    value: `${interaction.user}`,
                    inline: true
                }
            )

            .setTimestamp();

        // Final Reply
        await interaction.editReply({

            embeds: [successEmbed]
        });
    }
};
