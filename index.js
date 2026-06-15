const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
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

        client.commands.set(
            command.data.name,
            command
        );

        commands.push(
            command.data.toJSON()
        );
    }
}

// ======================
// REGISTER SLASH COMMANDS
// ======================
const rest =
    new REST({ version: '10' })
        .setToken(process.env.TOKEN);

(async () => {

    try {

        console.log(
            'Registering slash commands...'
        );

        await rest.put(

            Routes.applicationCommands(
                process.env.CLIENT_ID
            ),

            {
                body: commands
            }
        );

        console.log(
            'Slash commands registered.'
        );

    } catch (err) {

        console.error(err);
    }

})();

// ======================
// INTERACTIONS
// ======================
client.on(
    'interactionCreate',

    async interaction => {

        // ======================
        // TMOD PROMOTION BUTTONS
        // ======================
        if (interaction.isButton()) {

            if (
                interaction.customId.startsWith(
                    'tmodpromote_'
                )
            ) {

                const evaluatorRole =
                    '1515133506852749493';

                const moderatorRole =
                    '1515335023383806082';

                const trialModRole =
                    '1515335093319897239';

                const hasRole =
                    interaction.member.roles.cache.has(
                        evaluatorRole
                    );

                if (!hasRole) {

                    return interaction.reply({

                        content:
                            '❌ You cannot use this button.',

                        ephemeral: true
                    });
                }

                await interaction.deferUpdate();

                const userId =
                    interaction.customId.split(
                        '_'
                    )[1];

                const member =
                    await interaction.guild.members.fetch(
                        userId
                    );

                await member.roles.add(
                    moderatorRole
                );

                await member.roles.remove(
                    trialModRole
                );

                const oldEmbed =
                    interaction.message.embeds[0];

                const updatedEmbed =
                    EmbedBuilder.from(
                        oldEmbed
                    )

                        .setColor('Green')

                        .addFields({

                            name:
                                'Promotion Completed',

                            value:
                                `✅ Promoted by ${interaction.user}`
                        });

                const disabledRow =
                    new ActionRowBuilder()

                        .addComponents(

                            new ButtonBuilder()

                                .setCustomId(
                                    'completed'
                                )

                                .setLabel(
                                    `Completed By ${interaction.user.username}`
                                )

                                .setStyle(
                                    ButtonStyle.Success
                                )

                                .setDisabled(true)
                        );

                await interaction.editReply({

                    embeds: [updatedEmbed],

                    components:
                        [disabledRow]
                });

                try {

                    await member.send({

                        embeds: [

                            new EmbedBuilder()

                                .setColor(
                                    'Green'
                                )

                                .setTitle(
                                    '🎉 Promotion'
                                )

                                .setDescription(
                                    `You have been promoted to <@&${moderatorRole}> by ${interaction.user}.`
                                )

                                .setTimestamp()
                        ]
                    });

                } catch {

                    console.log(
                        `Could not DM ${member.user.tag}`
                    );
                }

                return;
            }

            return;
        }

        // ======================
        // SLASH COMMANDS
        // ======================
        if (
            !interaction.isChatInputCommand()
        ) {
            return;
        }

        const command =
            client.commands.get(
                interaction.commandName
            );

        if (!command) {
            return;
        }

        try {

            await command.execute(
                interaction,
                client
            );

        } catch (err) {

            console.error(err);

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({

                    content:
                        '❌ Error executing command.',

                    ephemeral: true
                });

            } else {

                await interaction.reply({

                    content:
                        '❌ Error executing command.',

                    ephemeral: true
                });
            }
        }
    }
);

// ======================
// READY EVENT
// ======================
client.once(
    'clientReady',

    () => {

        console.log(
            `${client.user.tag} is online.`
        );
    }
);

// ======================
client.login(
    process.env.TOKEN
);
