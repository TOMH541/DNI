const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes
} = require('discord.js');

const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================================
// SAFE DATABASE BOOTSTRAP (FIX)
// ================================
const dbFolder = './data';
const dbPath = './data/punishments.json';

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder);
}

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '{}');
}

// ================================
// COMMAND LOADING
// ================================
client.commands = new Collection();

const commandFiles = fs
    .readdirSync('./commands')
    .filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {

    const command = require(`./commands/${file}`);

    if (command.data) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

// ================================
// REGISTER COMMANDS
// ================================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Slash commands registered.');
    } catch (err) {
        console.error(err);
    }
})();

// ================================
// INTERACTIONS (BUTTON SAFE FIX)
// ================================
client.on('interactionCreate', async (interaction) => {

    try {

        // ================= BUTTONS =================
        if (interaction.isButton()) {

            if (!fs.existsSync(dbPath)) {
                fs.writeFileSync(dbPath, '{}');
            }

            let db;

            try {
                db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            } catch {
                db = {};
            }

            const allowedRoles = ['1515450853719277598'];

            const hasRole = interaction.member.roles.cache.some(r =>
                allowedRoles.includes(r.id)
            );

            if (!hasRole) {
                return interaction.reply({
                    content: '❌ No permission.',
                    flags: 64
                });
            }

            const [action, id] = interaction.customId.split('_');

            const data = db[id];

            if (!data) {
                return interaction.reply({
                    content: '❌ Case not found (may have expired).',
                    flags: 64
                });
            }

            const guild = interaction.guild;
            const member = await guild.members.fetch(data.userId).catch(() => null);

            // ================= APPROVE =================
            if (action === 'approve') {

                data.status = 'approved';

                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

                return interaction.update({
                    content: `✅ Approved by ${interaction.user.tag}`,
                    components: []
                });
            }

            // ================= REVOKE =================
            if (action === 'revoke') {

                try {
                    if (data.type === 'ban') {
                        await guild.members.unban(data.userId).catch(() => {});
                    }

                    if (data.type === 'timeout' && member) {
                        await member.timeout(null).catch(() => {});
                    }
                } catch (err) {
                    console.log(err);
                }

                data.status = 'revoked';

                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

                return interaction.update({
                    content: `❌ Revoked by ${interaction.user.tag}`,
                    components: []
                });
            }

            // ================= REMIND =================
            if (action === 'remind') {

                const thread = interaction.channel.threads.cache.find(t =>
                    t.name.includes(id)
                );

                if (thread) {
                    await thread.send(
                        `📌 <@${interaction.user.id}> please provide proof for **${id}**`
                    );
                }

                return interaction.reply({
                    content: '📩 Reminder sent.',
                    flags: 64
                });
            }
        }

        // ================= COMMANDS =================
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        await command.execute(interaction, client);

    } catch (err) {

        console.error('INTERACTION ERROR:', err);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ Error occurred safely.',
                flags: 64
            });
        } else {
            await interaction.reply({
                content: '❌ Error occurred safely.',
                flags: 64
            });
        }
    }
});

// ================================
// READY EVENT
// ================================
client.once('clientReady', () => {
    console.log(`${client.user.tag} is online.`);
});

client.login(process.env.TOKEN);
