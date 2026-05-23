const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

const staffRoles = ['1505033520589049876'];

module.exports = {

    data: new SlashCommandBuilder()
        .setName('officerreportpanel')
        .setDescription('Send the Officer Report Panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('CIU Officer Reports')
            .setDescription(
                'Click the button below to open an officer report ticket.'
            )
            .setColor('Red');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_officer_report')
                .setLabel('Open Officer Report')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};

module.exports.buttonHandler = async (interaction) => {

    if (interaction.customId !== 'open_officer_report') return;

    const guild = interaction.guild;

    const channel = await guild.channels.create({
        name: `report-${interaction.user.username}`,
        type: ChannelType.GuildText,

        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },

            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            },

            ...staffRoles.map(roleId => ({
                id: roleId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            }))
        ]
    });

    const embed = new EmbedBuilder()
        .setTitle('Officer Report Ticket')
        .setDescription(
            'Please explain your officer report.\n\n' +
            'The FIRST message sent will rename the channel automatically.'
        )
        .setColor('Blue');

    await channel.send({
        content: `${interaction.user}`,
        embeds: [embed]
    });

    await interaction.reply({
        content: `Your report ticket has been created: ${channel}`,
        ephemeral: true
    });

    const collector = channel.createMessageCollector({
        max: 1
    });

    collector.on('collect', async msg => {

        const cleanName = interaction.user.username
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');

        await channel.setName(`${cleanName}-report`);
    });
};

module.exports.addUserCommand = {
    data: new SlashCommandBuilder()
        .setName('officerrepadd')
        .setDescription('Add a user to the officer report')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to add')
                .setRequired(true)
        ),

    async execute(interaction) {

        const hasRole = interaction.member.roles.cache.some(r =>
            staffRoles.includes(r.id)
        );

        if (!hasRole) {
            return interaction.reply({
                content: 'You do not have permission.',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');

        await interaction.channel.permissionOverwrites.edit(user.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        const notifyEmbed = new EmbedBuilder()
            .setDescription(
                `You've been added to an officer report in **CIU Commander**.\n` +
                `Please review and respond: ${interaction.channel}`
            )
            .setColor('Blue');

        try {
            await user.send({
                embeds: [notifyEmbed]
            });
        } catch (err) {}

        await interaction.reply({
            content: `${user} has been added to the report.`,
            ephemeral: true
        });
    }
};