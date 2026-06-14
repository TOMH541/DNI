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
        GatewayIntentBits.GuildMembers
    ]
});

// ======================
// COMMAND HANDLER
// ======================
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

// ======================
// REGISTER SLASH COMMANDS
// ======================
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

// ======================
// INTERACTIONS
// ======================
client.on('interactionCreate', async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (err) {
        console.error(err);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ Error executing command.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ Error executing command.',
                ephemeral: true
            });
        }
    }
});

// ======================
// READY EVENT
// ======================
client.once('clientReady', () => {
    console.log(`${client.user.tag} is online.`);
});

// ======================
client.login(process.env.TOKEN);
