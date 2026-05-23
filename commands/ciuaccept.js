const {
SlashCommandBuilder,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require('discord.js');

module.exports = {

data:new SlashCommandBuilder()
.setName('sendciuapplication')
.setDescription('Send CIU acceptance')
.addUserOption(option=>
option.setName('user')
.setDescription('User')
.setRequired(true)
),

async execute(interaction){

const user = interaction.options.getUser('user');

const embed = new EmbedBuilder()
.setTitle('CIU Application - Next Steps')
.setColor('Gold')
.setDescription(
`Hey ${user.username}, congratulations, you have passed the first stage of the CIU application process.\n\nYou have been added to the server.`
);

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId(`accept_${user.id}`)
.setLabel('Accept')
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`deny_${user.id}`)
.setLabel('Deny')
.setStyle(ButtonStyle.Danger)

);

await user.send({
embeds:[embed],
components:[row]
});

await interaction.reply({
content:'Application sent.',
ephemeral:true
});

}
};