const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const fs = require('fs');

const allowedRoles = [
    '1515450853719277598'
];

const LOG_FILE = './tasklogs.json';

module.exports = {

    data: new SlashCommandBuilder()
        .setName('logtask')
        .setDescription('Submit a task log')
        .addStringOption(option =>
            option
                .setName('activitytype')
                .setDescription('Activity Type')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('date')
                .setDescription('Date')
                .setRequired(true)
        ),

    async execute(interaction) {

        const activity =
            interaction.options.getString('activitytype');

        const date =
            interaction.options.getString('date');

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('Task Log Submission')
            .addFields(
                {
                    name: 'User',
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: 'Date',
                    value: date,
                    inline: true
                },
                {
                    name: 'Activity Type',
                    value: activity,
                    inline: false
                },
                {
                    name: 'Status',
                    value: 'Pending',
                    inline: false
                }
            );

        const row = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `taskapprove_${interaction.user.id}`
                    )
                    .setLabel('Approve')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(
                        `taskdeny_${interaction.user.id}`
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

            await i.deferUpdate();

            const hasRole =
                i.member.roles.cache.some(r =>
                    allowedRoles.includes(r.id)
                );

            if (!hasRole) {

                return i.followUp({
                    content:
                    'You cannot approve logs.',
                    ephemeral: true
                });
            }

            const [action, userId] =
                i.customId.split('_');

            if (action === 'taskapprove') {

                let data = {};

                if (fs.existsSync(LOG_FILE)) {

                    data = JSON.parse(
                        fs.readFileSync(LOG_FILE)
                    );
                }

                data[userId] =
                    (data[userId] || 0) + 1;

                fs.writeFileSync(
                    LOG_FILE,
                    JSON.stringify(data, null, 2)
                );

                const approvedEmbed =
                    EmbedBuilder.from(embed)
                        .setColor('Green')
                        .spliceFields(3, 1, {
                            name: 'Status',
                            value: 'Approved'
                        });

                const row =
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

                await i.editReply({
                    embeds: [approvedEmbed],
                    components: [row]
                });
            }

            if (action === 'taskdeny') {

                const deniedEmbed =
                    EmbedBuilder.from(embed)
                        .setColor('Red')
                        .spliceFields(3, 1, {
                            name: 'Status',
                            value: 'Denied'
                        });

                const row =
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

                await i.editReply({
                    embeds: [deniedEmbed],
                    components: [row]
                });
            }
        });
    }
};
