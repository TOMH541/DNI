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
        .setDescription('Request a role to be added or removed')

        .addRoleOption(option =>
            option
                .setName('add_role')
                .setDescription('Role to add')
                .setRequired(false)
        )

        .addRoleOption(option =>
            option
                .setName('remove_role')
                .setDescription('Role to remove')
                .setRequired(false)
        )

        .addUserOption(option =>
            option
                .setName('requester')
                .setDescription('User affected by the request')
                .setRequired(false)
        ),

    async execute(interaction) {

        const addRole =
            interaction.options.getRole('add_role');

        const removeRole =
            interaction.options.getRole('remove_role');

        const requester =
            interaction.options.getUser('requester')
            || interaction.user;

        if (!addRole && !removeRole) {
            return interaction.reply({
                content:
                    'You must select a role to add or remove.',
                flags: 64
            });
        }

        if (addRole && removeRole) {
            return interaction.reply({
                content:
                    'You can only request one action at a time.',
                flags: 64
            });
        }

        const role = addRole || removeRole;

        const requestType =
            addRole ? 'Add' : 'Remove';

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

        const collector =
            msg.createMessageComponentCollector();

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
                await interaction.guild.members.fetch(
                    userId
                );

            const guildRole =
                interaction.guild.roles.cache.get(
                    roleId
                );

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
                                .setStyle(
                                    ButtonStyle.Success
                                )
                                .setDisabled(true)
                        );

                try {

                    await member.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setTitle(
                                    'Role Request Approved'
                                )
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

                await i.update({
                    embeds: [approvedEmbed],
                    components: [disabledRow]
                });
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
                                .setStyle(
                                    ButtonStyle.Danger
                                )
                                .setDisabled(true)
                        );

                try {

                    await member.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(
                                    'Role Request Denied'
                                )
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

                await i.update({
                    embeds: [deniedEmbed],
                    components: [disabledRow]
                });
            }
        });
    }
};
