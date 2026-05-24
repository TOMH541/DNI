const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const allowedRoles = [
    '1507820452641509496'
];

module.exports = {

    data: new SlashCommandBuilder()

        .setName('promote')

        .setDescription('Promote a user')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User')
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName('rank')
                .setDescription('New rank')
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

        const role =
        interaction.options.getRole('rank');

        const member =
        await interaction.guild.members.fetch(user.id);

        await member.roles.add(role);

        const dmEmbed = new EmbedBuilder()

            .setColor('Green')

            .setTitle('🎉 Promotion')

            .setDescription(
                `You have been promoted by ${interaction.user}!`
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
                `Successfully promoted ${user} to ${role}.`
            );

        await interaction.reply({

            embeds: [successEmbed]
        });
    }
};
