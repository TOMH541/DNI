const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const allowedRoles = ['1504903869061136484'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolerequest')
        .setDescription('Request to add or remove a role')

        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to modify')
                .setRequired(true)
        )

        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to add/remove')
                .setRequired(true)
        )

        .addStringOption(option =>
            option.setName('action')
                .setDescription('Add or remove role')
                .setRequired(true)
                .addChoices(
                    { name: 'Add Role', value: 'add' },
                    { name: 'Remove Role', value: 'remove' }
                )
        )

        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for request')
                .setRequired(false)
        ),

    async execute(interaction) {

        const target = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const actionType = interaction.options.getString('action');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const actionText =
            actionType === 'add'
                ? 'Add Role'
                : 'Remove Role';

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
                    name: 'Target User',
                    value: `${target}`,
                    inline: true
                },
                {
                    name: 'Action',
                    value: actionText,
                    inline: true
                },
                {
                    name: 'Role',
                    value: `${role}`,
                    inline: true
                },
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                },
                {
                    name: 'Status',
                    value: 'Pending',
                    inline: false
                }
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId(`approve_${target.id}_${role.id}_${actionType}`)
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`deny_${target.id}_${role.id}_${actionType}`)
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

            const hasRole = i.member.roles.cache.some(r =>
                allowedRoles.includes(r.id)
            );

            if (!hasRole) {
                return i.reply({
                    content: 'You are not allowed to approve or deny requests.',
                    ephemeral: true
                });
            }

            const [decision, userId, roleId, type] = i.customId.split('_');

            const member = await interaction.guild.members.fetch(userId);
            const guildRole = interaction.guild.roles.cache.get(roleId);

            if (decision === 'approve') {

                if (type === 'add') {
                    await member.roles.add(guildRole);
                }

                if (type === 'remove') {
                    await member.roles.remove(guildRole);
                }

                const approvedEmbed = EmbedBuilder.from(embed)
                    .setColor('Green')
                    .spliceFields(5, 1, {
                        name: 'Status',
                        value: 'Approved'
                    });

                const approvedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('approvedby')
                        .setLabel(`Approved By ${i.user.username}`)
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );

                await i.update({
                    embeds: [approvedEmbed],
                    components: [approvedRow]
                });
            }

            if (decision === 'deny') {

                const deniedEmbed = EmbedBuilder.from(embed)
                    .setColor('Red')
                    .spliceFields(5, 1, {
                        name: 'Status',
                        value: 'Denied'
                    });

                const deniedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('deniedby')
                        .setLabel(`Denied By ${i.user.username}`)
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

                await i.update({
                    embeds: [deniedEmbed],
                    components: [deniedRow]
                });
            }
        });
    }
};