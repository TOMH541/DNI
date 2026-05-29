const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()

        .setName('senddocuments')

        .setDescription('Send CIU documents embed'),

    async execute(interaction) {

        const embed = new EmbedBuilder()

            .setColor('Blue')

            .setTitle('📚 CIU Directory')

            .setDescription(
`**Link Directory:**  
https://sites.google.com/view/ciu-links/

**Vehicle Structure:**  
https://docs.google.com/presentation/d/1wtqQXjGGdIVH3ag1oxTfBf7gJuS19uDXDI4THTj1APU/edit?usp=sharing

**Uniform Structure:**  
https://docs.google.com/presentation/d/1fb2pzDsUki8W-sHLkrkY-ksVLD6m64q7rdS-1GV2MGk/edit?usp=sharing

**Clip Submissions:**  
https://busy-ivory-stfruoijsp.edgeone.app/

**SOP:**  
https://docs.google.com/document/d/1-e9dFIoz2nJemgj9PbNUtDrIhu79lrOfzRdFSSWuos/edit?usp=sharing

**Application:**  
https://forms.gle/bzPWrkE9V41GrJcx5

**Roster:**  
https://docs.google.com/spreadsheets/d/1LCqxCwlpxqwDEs48r6JjqGfokTXIgDIRdMjdA9Rljjc/edit?usp=sharing

**Reward Info:**  
https://docs.google.com/document/d/1OhALen9VlaOHllponmw0_HEA4-54t5kYKULx0S3sg5c/edit?usp=sharing

**Recruitment Guide:**  
https://docs.google.com/document/d/1X02F6jpuBbgxYB6zXxr0oRlt7kH-8GJcLx_86fxuH94/edit?usp=sharing`
            )

            .setTimestamp();

        await interaction.reply({

            embeds: [embed]
        });
    }
};
