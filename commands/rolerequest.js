const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const allowedRoles = [
    '1515450853719277598'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolerequest')
        .setDescription('Request to add or remove a role')

        .addSubcommand(subcommand =>
            subcommand
                .setName('add_role')
                .setDescription('Request to add a role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to add')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName('requester')
                        .setDescription('User receiving the role')
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('remove_role')
                .setDescription('Request to remove a role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName('requester')
                        .setDescription('User losing the role')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {

        const subcommand =
            interaction.options.getSubcommand();

        const role =
            interaction.options.getRole('role');

        const requester =
            interaction.options.getUser('requester');

        const requestType =
            subcommand === 'add_role'
                ? 'Add'
                : 'Remove';

        const embed = new EmbedBuilder()
            .setTitle('Role Request')
            .setColor('Blue')
            .addFields(
                {
                    name: 'Requested By',
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: 'Requester',
                    value: `${requester}`,
                    inline: true
                },
                {
                    name:
                        requestType === 'Add'
                            ? 'Role to Add'
                            : 'Role to Remove',
                    value: `${role}`,
                    inline: false
                },
                {
                    name: 'Status',
                    value: 'Pending',
                    inline: false
                }
            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `approve_${requester.id}_${role.id}_${requestType}`
                    )
                    .setLabel('Approve')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(
                        `deny_${requester.id}_${role.id}_${requestType}`
                    )
                    .setLabel('Deny')
                    .setStyle(ButtonStyle.Danger)
            );

        const msg = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true
        });

        const collector = msg.createMessageComponentCollector();

        collector.on('collect', async i => {

            const hasRole =
                i.member.roles.cache.some(role =>
                    allowedRoles.includes(role.id)
                );

            if (!hasRole) {
                return i.reply({
                    content:
                        'You are not allowed to approve or deny requests.',
                    flags: 64
                });
            }

            const [
                decision,
                userId,
                roleId,
                action
            ] = i.customId.split('_');

            const member =
                await interaction.guild.members.fetch(userId);

            const guildRole =
                interaction.guild.roles.cache.get(roleId);

            if (decision === 'approve') {

                if (action === 'Add') {

                    await member.roles.add(guildRole);

                } else {

                    await member.roles.remove(guildRole);
                }

                const approvedEmbed =
                    EmbedBuilder.from(embed)
                        .setColor('Green')
                        .spliceFields(3, 1, {
                            name: 'Status',
                            value: 'Approved'
                        });

                const disabledRow =
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('approved')
                                .setLabel(
                                    `Approved By: ${i.user.username}`
                                )
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true)
                        );

                await i.update({
                    embeds: [approvedEmbed],
                    components: [disabledRow]
                });

                try {

                    await member.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setTitle('Role Request Approved')
                                .setDescription(
                                    action === 'Add'
                                        ? `You have been given the ${guildRole} role.`
                                        : `The ${guildRole} role has been removed from you.`
                                )
                                .addFields(
                                    {
                                        name: 'Approved By',
                                        value: `${i.user}`,
                                        inline: false
                                    }
                                )
                                .setTimestamp()
                        ]
                    });

                } catch {}
            }

            if (decision === 'deny') {

                const deniedEmbed =
                    EmbedBuilder.from(embed)
                        .setColor('Red')
                        .spliceFields(3, 1, {
                            name: 'Status',
                            value: 'Denied'
                        });

                const disabledRow =
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('denied')
                                .setLabel(
                                    `Denied By: ${i.user.username}`
                                )
                                .setStyle(ButtonStyle.Danger)
                                .setDisabled(true)
                        );

                await i.update({
                    embeds: [deniedEmbed],
                    components: [disabledRow]
                });

                try {

                    await member.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Role Request Denied')
                                .setDescription(
                                    `Your request involving ${guildRole} was denied.`
                                )
                                .addFields(
                                    {
                                        name: 'Denied By',
                                        value: `${i.user}`,
                                        inline: false
                                    }
                                )
                                .setTimestamp()
                        ]
                    });

                } catch {}
            }
        });
    }
};
