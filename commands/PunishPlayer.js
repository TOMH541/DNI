const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');

const fs = require('fs');

const STAFF_ROLE = '1515450853719277598';
const LOG_CHANNEL = '1515510902785446010';

const DATA_FOLDER = './data';
const DATA_FILE = './data/punishments.json';

function ensureDatabase() {
    if (!fs.existsSync(DATA_FOLDER)) {
        fs.mkdirSync(DATA_FOLDER);
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '{}');
    }
}

function loadCases() {
    ensureDatabase();

    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveCases(data) {
    ensureDatabase();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateCaseID() {
    return Math.floor(
        1000000000 + Math.random() * 9000000000
    ).toString();
}

function parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) return null;

    const amount = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000
    };

    return amount * multipliers[unit];
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName('punishment')
        .setDescription('Issue a punishment.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to punish')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('punishment')
                .setDescription('Punishment type')
                .setRequired(true)
                .addChoices(
                    { name: 'Warning', value: 'warning' },
                    { name: 'Timeout', value: 'timeout' },
                    { name: 'Ban', value: 'ban' }
                )
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Example: 7d (required for timeout)')
                .setRequired(false)
        ),

    async execute(interaction) {

        if (
            !interaction.member.roles.cache.has(STAFF_ROLE)
        ) {
            return interaction.reply({
                content: '❌ You cannot use this command.',
                ephemeral: true
            });
        }

        const user =
            interaction.options.getUser('user');

        const type =
            interaction.options.getString('punishment');

        const reason =
            interaction.options.getString('reason');

        const duration =
            interaction.options.getString('duration');

        const caseID = generateCaseID();

        let member = null;

        try {
            member = await interaction.guild.members.fetch(
                user.id
            );
        } catch {}

        // Apply punishment safely
        try {

            if (
                type === 'timeout' &&
                member
            ) {

                if (!member.moderatable) {
                    return interaction.reply({
                        content:
                            '❌ I cannot timeout this user.',
                        ephemeral: true
                    });
                }

                const ms =
                    parseDuration(duration);

                if (!ms) {
                    return interaction.reply({
                        content:
                            '❌ Invalid duration.',
                        ephemeral: true
                    });
                }

                await member.timeout(
                    ms,
                    reason
                );
            }

            if (type === 'ban') {

                await interaction.guild.members.ban(
                    user.id,
                    { reason }
                );
            }

        } catch (err) {

            console.error(err);

            return interaction.reply({
                content:
                    '❌ Failed to apply punishment.',
                ephemeral: true
            });
        }

        // DM User
        try {

            const dmEmbed =
                new EmbedBuilder()

                    .setColor('Red')

                    .setTitle(
                        'Punishment Issued'
                    )

                    .addFields(
                        {
                            name: 'Punishment',
                            value: type
                        },
                        {
                            name: 'Reason',
                            value: reason
                        },
                        {
                            name: 'Duration',
                            value:
                                duration ||
                                'N/A'
                        },
                        {
                            name: 'Issued By',
                            value:
                                `${interaction.user}`
                        }
                    );

            await user.send({
                embeds: [dmEmbed]
            });

        } catch {}

        // Save case
        const cases = loadCases();

        cases[caseID] = {

            userId: user.id,

            moderatorId:
                interaction.user.id,

            type,

            reason,

            duration:
                duration || 'N/A',

            timestamp:
                Date.now(),

            status: 'Pending'
        };

        saveCases(cases);

        // Log Embed
        const embed =
            new EmbedBuilder()

                .setColor('Red')

                .setTitle(
                    'Punishment Issued'
                )

                .addFields(

                    {
                        name:
                            'Punished User',
                        value:
                            `${user}`
                    },

                    {
                        name:
                            'Punished By',
                        value:
                            `${interaction.user}`
                    },

                    {
                        name:
                            'Punishment',
                        value: type
                    },

                    {
                        name:
                            'Reason',
                        value: reason
                    },

                    {
                        name:
                            'Duration',
                        value:
                            duration ||
                            'N/A'
                    },

                    {
                        name:
                            'Case ID',
                        value:
                            caseID
                    }
                );

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            `approve_${caseID}`
                        )

                        .setLabel(
                            'Approve'
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `revoke_${caseID}`
                        )

                        .setLabel(
                            'Revoke'
                        )

                        .setStyle(
                            ButtonStyle.Danger
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `remind_${caseID}`
                        )

                        .setLabel(
                            'Remind For Proof'
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        )
                );

        const channel =
            interaction.guild.channels.cache.get(
                LOG_CHANNEL
            );

        if (channel) {

            const message =
                await channel.send({

                    embeds: [embed],

                    components: [row]
                });

            const thread =
                await message.startThread({

                    name:
                        `Proof-${caseID}`,

                    autoArchiveDuration:
                        1440,

                    type:
                        ChannelType.PrivateThread
                });

            await thread.send(

                `<@${interaction.user.id}> Please send proof here.`
            );
        }

        await interaction.reply({

            content:
                `✅ Punishment issued. Case ID: ${caseID}`,

            ephemeral: true
        });
    }
};
