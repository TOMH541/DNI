const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('closereport')
        .setDescription('Close the officer report'),

    async execute(interaction) {

        await interaction.reply({
            content: 'Closing report in 5 seconds...'
        });

        setTimeout(async () => {

            try {
                await interaction.channel.delete();
            } catch (err) {
                console.error(err);
            }

        }, 5000);
    }
};