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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('punishment')
        .setDescription('Issue a punishment to a user')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User being punished')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('punishment')
                .setDescription('Type of punishment')
                .setRequired(true)
                .addChoices(
                    { name: 'Ban', value: 'ban' },
                    { name: 'Timeout', value: 'timeout' },
                    { name: 'Warning', value: 'warning' }
                )
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for punishment')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Duration (e.g. 14d, 6h, 10m)')
                .setRequired(true)
        ),

    async execute(interaction) {

        const hasRole = interaction.member.roles.cache.some(r =>
            allowedRoles.includes(r.id)
        );

        if (!hasRole) {
            return interaction.reply({
                content: '❌ No permission.',
                flags: 64
            });
        }

        const user = interaction.options.getUser('user');
        const type = interaction.options.getString('punishment');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getString('duration');

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const id = generateID();

        // Apply punishment safely
        try {

            if (type === 'ban') {
                await interaction.guild.members.ban(user.id, { reason });
            }

            if (type === 'timeout' && member) {

                let ms = 0;
                const match = duration.match(/(\d+)([smhd])/);

                if (match) {
                    const num = parseInt(match[1]);
                    const unit = match[2];

                    if (unit === 's') ms = num * 1000;
                    if (unit === 'm') ms = num * 60000;
                    if (unit === 'h') ms = num * 3600000;
                    if (unit === 'd') ms = num * 86400000;
                }

                await member.timeout(ms, reason);
            }

        } catch (err) {
            console.log('Punishment error:', err);
        }

        // Save DB
        const db = loadDB();

        db[id] = {
            userId: user.id,
            type,
            reason,
            duration,
            status: 'pending'
        };

        saveDB(db);

        const embed = new EmbedBuilder()
            .setTitle('Punishment Issued')
            .setColor('Red')
            .addFields(
                { name: 'User', value: `${user}`, inline: true },
                { name: 'Type', value: type, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Duration', value: duration, inline: true },
                { name: 'ID', value: id, inline: true },
                { name: 'Status', value: 'Pending', inline: false }
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
            name: `Proof-${id}`,
            autoArchiveDuration: 1440
        });

        await thread.send(`📌 <@${interaction.user.id}> please provide proof here.`);

        return interaction.reply({
            content: '✅ Punishment issued successfully.',
            flags: 64
        });
    }
};
