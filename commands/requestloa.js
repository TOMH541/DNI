const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const allowedRoles = [
    '1507820452641509496'
];

const loaRole = '1507157071655866439';

module.exports = {

    data: new SlashCommandBuilder()

        .setName('requestloa')

        .setDescription('Request a Leave of Absence')

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for LOA')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('length')
                .setDescription('Length Example: 7d')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('notes')
                .setDescription('Extra notes')
                .setRequired(false)
        ),

    async execute(interaction) {

        const reason =
        interaction.options.getString('reason');

        const length =
        interaction.options.getString('length');

        const notes =
        interaction.options.getString('notes')
        || 'No notes provided.';

        const embed = new EmbedBuilder()

            .setTitle('LOA Request')

            .setColor('Blue')

            .addFields(

                {
                    name: 'Requested By',
                    value: `${interaction.user}`,
                    inline: true
                },

                {
                    name: '📆 Length',
                    value: length,
                    inline: true
                },

                {
                    name: '📝 Reason',
                    value: reason,
                    inline: false
                },

                {
                    name: '📋 Notes',
                    value: notes,
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
                        `loaapprove_${interaction.user.id}`
                    )

                    .setLabel('Approve')

                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()

                    .setCustomId(
                        `loadeny_${interaction.user.id}`
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

            // FIXES INTERACTION FAILED
            await i.deferUpdate();

            const hasRole =
            i.member.roles.cache.some(r =>
                allowedRoles.includes(r.id)
            );

            if (!hasRole) {

                return i.followUp({

                    content:
                    'You cannot approve LOAs.',

                    ephemeral: true
                });
            }

            const [action, userId] =
            i.customId.split('_');

            const member =
            await interaction.guild.members.fetch(userId);

            if (action === 'loaapprove') {

                await member.roles.add(loaRole);

                const approvedEmbed =
                EmbedBuilder.from(embed)

                    .setColor('Green')

                    .spliceFields(4, 1, {

                        name: 'Status',

                        value: 'Approved'
                    });

                const disabledRow =
                new ActionRowBuilder()

                    .addComponents(

                        new ButtonBuilder()

                            .setCustomId('approved')

                            .setLabel(
                                `LOA Approved By: ${i.user.username}`
                            )

                            .setStyle(ButtonStyle.Success)

                            .setDisabled(true)
                    );

                try {

                    await member.send({

                        embeds: [

                            new EmbedBuilder()

                                .setColor('Green')

                                .setTitle(
                                    '🛫 Leave of Absence Approved'
                                )

                                .setDescription(
                                    'Your LOA request has been approved.'
                                )

                                .addFields(

                                    {
                                        name: '📆 Length',
                                        value: length,
                                        inline: true
                                    },

                                    {
                                        name: '📝 Reason',
                                        value: reason,
                                        inline: false
                                    },

                                    {
                                        name: '📋 Notes',
                                        value: notes,
                                        inline: false
                                    },

                                    {
                                        name: '👮 Approved By',
                                        value: `${i.user}`,
                                        inline: false
                                    }
                                )

                                .setTimestamp()
                        ]
                    });

                } catch {}

                await i.editReply({

                    embeds: [approvedEmbed],

                    components: [disabledRow]
                });
            }

            if (action === 'loadeny') {

                const deniedEmbed =
                EmbedBuilder.from(embed)

                    .setColor('Red')

                    .spliceFields(4, 1, {

                        name: 'Status',

                        value: 'Denied'
                    });

                const disabledRow =
                new ActionRowBuilder()

                    .addComponents(

                        new ButtonBuilder()

                            .setCustomId('denied')

                            .setLabel(
                                `LOA Denied By: ${i.user.username}`
                            )

                            .setStyle(ButtonStyle.Danger)

                            .setDisabled(true)
                    );

                try {

                    await member.send({

                        embeds: [

                            new EmbedBuilder()

                                .setColor('Red')

                                .setTitle(
                                    '❌ Leave of Absence Denied'
                                )

                                .setDescription(
                                    'Your LOA request has been denied.'
                                )

                                .addFields(

                                    {
                                        name: '📆 Length',
                                        value: length,
                                        inline: true
                                    },

                                    {
                                        name: '📝 Reason',
                                        value: reason,
                                        inline: false
                                    },

                                    {
                                        name: '📋 Notes',
                                        value: notes,
                                        inline: false
                                    },

                                    {
                                        name: '👮 Denied By',
                                        value: `${i.user}`,
                                        inline: false
                                    }
                                )

                                .setTimestamp()
                        ]
                    });

                } catch {}

                await i.editReply({

                    embeds: [deniedEmbed],

                    components: [disabledRow]
                });
            }
        });
    }
};
