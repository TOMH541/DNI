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

    if (command.addUserCommand) {
        client.commands.set(
            command.addUserCommand.data.name,
            command.addUserCommand
        );

        commands.push(
            command.addUserCommand.data.toJSON()
        );
    }
}

const rest = new REST({ version: '10' })
    .setToken(process.env.TOKEN);

(async () => {

    try {

        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Slash commands registered.');

    } catch (error) {
        console.error(error);
    }

})();

client.on('interactionCreate', async interaction => {

    try {

        if (!interaction.isChatInputCommand()) return;

        const command =
            client.commands.get(interaction.commandName);

        if (!command) return;

        await command.execute(interaction);

    } catch (error) {

        console.error(error);

        if (interaction.replied || interaction.deferred) {

            await interaction.followUp({
                content:
                    'There was an error while executing this command!',
                ephemeral: true
            });

        } else {

            await interaction.reply({
                content:
                    'There was an error while executing this command!',
                ephemeral: true
            });
        }
    }
});

client.once('clientReady', () => {
    console.log(`${client.user.tag} is online.`);
});

client.login(process.env.TOKEN);
