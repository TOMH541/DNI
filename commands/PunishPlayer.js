const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');

const allowedRoles = [
    '1515450853719277598'
];

const logChannelId = '1515510902785446010';

const punishmentDBPath = './data/punishments.json';

// Load DB
function loadDB() {
    if (!fs.existsSync(punishmentDBPath)) return {};
    return JSON.parse(fs.readFileSync(punishmentDBPath, 'utf8'));
}

// Save DB
function saveDB(data) {
    fs.writeFileSync(punishmentDBPath, JSON.stringify(data, null, 2));
}

// Random ID
function generateID() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('punishment')
        .setDescription('Issue a staff punishment')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User being punished')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('punishment')
                .setDescription('Type of punishment')
                .setRequired(true)
                .addChoices(
                    { name: 'Ban', value: 'ban' },
                    { name: 'Timeout', value: 'timeout' },
                    { name: 'Warning', value: 'warning' }
                )
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g 14d)')
                .setRequired(true)
        ),

    async execute(interaction, client) {

        const hasRole = interaction.member.roles.cache.some(r =>
            allowedRoles.includes(r.id)
        );

        if (!hasRole) {
            return interaction.reply({
                content: 'You cannot use this command.',
                flags: 64
            });
        }

        const user = interaction.options.getUser('user');
        const type = interaction.options.getString('punishment');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getString('duration');

        const member = await interaction.guild.members.fetch(user.id);

        const punishmentId = generateID();

        let actionText = type.toUpperCase();
        let color = 'Red';

        // Apply punishment
        if (type === 'ban') {
            await member.ban({ reason });
        }

        if (type === 'timeout') {

            const ms = parseDuration(duration);
            await member.timeout(ms, reason);
        }

        if (type === 'warning') {
            actionText = 'WARNING';
        }

        const embed = new EmbedBuilder()
            .setTitle('Punishment Issued')
            .setColor(color)
            .addFields(
                { name: 'Punished Player', value: `${user}`, inline: true },
                { name: 'Punished By', value: `${interaction.user}`, inline: true },
                { name: 'Punishment ID', value: punishmentId, inline: false },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Duration', value: duration, inline: true },
                { name: 'Status', value: 'Pending Approval', inline: true }
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`approve_${punishmentId}`)
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`revoke_${punishmentId}`)
                .setLabel('Revoke')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId(`remind_${punishmentId}`)
                .setLabel('Remind For Proof')
                .setStyle(ButtonStyle.Secondary)
        );

        const channel = await interaction.guild.channels.fetch(logChannelId);

        const msg = await channel.send({
            embeds: [embed],
            components: [row]
        });

        const thread = await msg.startThread({
            name: `Proof - ${punishmentId}`,
            autoArchiveDuration: 1440
        });

        await thread.send(`<@${interaction.user.id}> Please send proof here.`);

        try {
            await user.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Punishment Notice')
                        .setColor('Red')
                        .setDescription(`You received a **${type}**`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Duration', value: duration },
                            { name: 'Punishment ID', value: punishmentId }
                        )
                ]
            });
        } catch {}

        // Save for auto revoke
        const db = loadDB();

        db[punishmentId] = {
            guildId: interaction.guild.id,
            userId: user.id,
            type,
            duration,
            timestamp: Date.now(),
            messageId: msg.id,
            channelId: logChannelId,
            status: 'pending'
        };

        saveDB(db);

        scheduleAutoRevoke(client, punishmentId);

        await interaction.reply({
            content: 'Punishment issued successfully.',
            flags: 64
        });
    }
};

// Duration parser
function parseDuration(str) {
    const match = str.match(/(\d+)([smhd])/);
    if (!match) return 0;

    const num = parseInt(match[1]);
    const unit = match[2];

    if (unit === 's') return num * 1000;
    if (unit === 'm') return num * 60000;
    if (unit === 'h') return num * 3600000;
    if (unit === 'd') return num * 86400000;

    return 0;
}

// Auto revoke system (persistent)
function scheduleAutoRevoke(client, id) {

    setTimeout(async () => {

        const db = loadDB();
        const entry = db[id];
        if (!entry || entry.status !== 'pending') return;

        const guild = await client.guilds.fetch(entry.guildId);
        const member = await guild.members.fetch(entry.userId).catch(() => null);

        if (member) {

            if (entry.type === 'ban') {
                await guild.members.unban(entry.userId).catch(() => {});
            }

            if (entry.type === 'timeout') {
                await member.timeout(null).catch(() => {});
            }
        }

        entry.status = 'auto_revoked';
        saveDB(db);

        const channel = await guild.channels.fetch(entry.channelId).catch(() => null);
        if (!channel) return;

        const msg = await channel.messages.fetch(entry.messageId).catch(() => null);
        if (!msg) return;

        const oldEmbed = EmbedBuilder.from(msg.embeds[0]);

        oldEmbed.addFields({
            name: 'Status',
            value: 'Auto Revoked (No approval in 24h)'
        });

        await msg.edit({ embeds: [oldEmbed], components: [] });

    }, 24 * 60 * 60 * 1000);
}
