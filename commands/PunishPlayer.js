const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const fs = require('fs');

const allowedRoles = ['1515450853719277598'];
const logChannelId = '1515510902785446010';

const dbPath = './data/punishments.json';

function loadDB() {
    if (!fs.existsSync(dbPath)) return {};
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function generateID() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('punishment')
        .setDescription('Issue a punishment')
        .addUserOption(o =>
            o.setName('user').setRequired(true)
        )
        .addStringOption(o =>
            o.setName('punishment')
                .setRequired(true)
                .addChoices(
                    { name: 'Ban', value: 'ban' },
                    { name: 'Timeout', value: 'timeout' },
                    { name: 'Warning', value: 'warning' }
                )
        )
        .addStringOption(o =>
            o.setName('reason').setRequired(true)
        )
        .addStringOption(o =>
            o.setName('duration').setRequired(true)
        ),

    async execute(interaction, client) {

        const hasRole = interaction.member.roles.cache.some(r =>
            allowedRoles.includes(r.id)
        );

        if (!hasRole) {
            return interaction.reply({
                content: 'No permission.',
                flags: 64
            });
        }

        const user = interaction.options.getUser('user');
        const type = interaction.options.getString('punishment');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getString('duration');

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const id = generateID();

        let ms = parseDuration(duration);

        // APPLY
        if (type === 'ban') {
            await interaction.guild.members.ban(user.id, { reason }).catch(() => {});
        }

        if (type === 'timeout' && member) {
            await member.timeout(ms, reason).catch(() => {});
        }

        // DB
        const db = loadDB();

        db[id] = {
            userId: user.id,
            type,
            reason,
            duration,
            status: 'pending',
            guildId: interaction.guild.id,
            channelId: logChannelId
        };

        saveDB(db);

        const embed = new EmbedBuilder()
            .setTitle('Punishment Issued')
            .setColor('Red')
            .addFields(
                { name: 'User', value: `${user}` },
                { name: 'Punishment', value: type },
                { name: 'Reason', value: reason },
                { name: 'Duration', value: duration },
                { name: 'ID', value: id },
                { name: 'Status', value: 'Pending' }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`approve_${id}`)
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`revoke_${id}`)
                .setLabel('Revoke')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId(`remind_${id}`)
                .setLabel('Remind For Proof')
                .setStyle(ButtonStyle.Secondary)
        );

        const channel = await interaction.guild.channels.fetch(logChannelId);

        const msg = await channel.send({
            embeds: [embed],
            components: [row]
        });

        const thread = await msg.startThread({
            name: `Proof - ${id}`,
            autoArchiveDuration: 1440
        });

        await thread.send(`<@${interaction.user.id}> Please send proof here.`);

        await interaction.reply({
            content: 'Punishment issued.',
            flags: 64
        });
    }
};
