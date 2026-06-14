const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const APPROVED_CHANNEL = '1515464133993041950';

module.exports = {

    data: new SlashCommandBuilder()

        .setName('roleadd')

        .setDescription('Add a role to a user.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to give the role to')
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('Role to add')
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

        if (member.roles.cache.has(role.id)) {

            return interaction.reply({
                content:
                    '❌ That user already has this role.',
                ephemeral: true
            });
        }

        try {

            await member.roles.add(role);

            const embed =
                new EmbedBuilder()

                    .setColor('Green')

                    .setTitle('Role Added')

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
                            name: 'Added By',
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
                    '❌ Failed to add the role.',
                ephemeral: true
            });
        }
    }
};
