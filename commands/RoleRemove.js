const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const APPROVED_CHANNEL = '1515464133993041950';

module.exports = {

    data: new SlashCommandBuilder()

        .setName('roleremove')

        .setDescription('Remove a role from a user.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to remove the role from')
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('Role to remove')
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles
        ),

    async execute(interaction) {

        if (interaction.channelId !== APPROVED_CHANNEL) {

            return interaction.reply({
                content:
                    '❌ This Is Not An Approved Channel For This Command.',
                ephemeral: true
            });
        }

        const user =
            interaction.options.getUser('user');

        const role =
            interaction.options.getRole('role');

        const member =
            await interaction.guild.members.fetch(
                user.id
            );

        if (
            role.position >=
            interaction.guild.members.me.roles.highest.position
        ) {

            return interaction.reply({
                content:
                    '❌ I cannot manage that role.',
                ephemeral: true
            });
        }

        if (!member.roles.cache.has(role.id)) {

            return interaction.reply({
                content:
                    '❌ That user does not have this role.',
                ephemeral: true
            });
        }

        try {

            await member.roles.remove(role);

            const embed =
                new EmbedBuilder()

                    .setColor('Red')

                    .setTitle('Role Removed')

                    .addFields(

                        {
                            name: 'User',
                            value: `${user}`,
                            inline: true
                        },

                        {
                            name: 'Role',
                            value: `${role}`,
                            inline: true
                        },

                        {
                            name: 'Removed By',
                            value: `${interaction.user}`,
                            inline: true
                        }
                    )

                    .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });

        } catch {

            await interaction.reply({
                content:
                    '❌ Failed to remove the role.',
                ephemeral: true
            });
        }
    }
};
