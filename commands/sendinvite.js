const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendinvite')
        .setDescription('Send CIU invite message to a user')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('Discord User ID')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const userId = interaction.options.getString('userid');

        try {
            const user = await interaction.client.users.fetch(userId);

            const message = `# <:CIULogo:1501097555944013985> CIU <:lspd:905642977509130260>

**You have been invited to join our BRAND NEW squadron:**

*The LSPD Confidential Informant Unit Focuses On Working With Criminals, Getting Evidence Mid Crime, Most Of Our Work Is Undercover With Our Ways Of Telling Still.*

**Your Job?**
Work together with criminals in day-to-day crimes such as robberies, assault, car theft and so on. We then request all standby backup to raid the property and arrest the suspect before they can even complete their crime.

*This Unit Aims To Do Alot Of Work With Gang Task Force And Vice Unit Together. We Will Participate In Many Events That Involve us!*

> **"Our Mission is NOT to Create Widows and Orphans. Our Mission is to Bring Order to Chaos."**

**Requirements:**
- LSPD rank of Corporal or above

**If You Have Any Questions Reach Out To Our 01/02:**
<@1118482759745294336> Or <@1213972467882926142>

**Apply Here:**
👉 https://forms.gle/bzPWrkE9V41GrJcx5`;

            await user.send(message);

            await interaction.reply({
                content: `Invite sent to ${user.tag}`,
                ephemeral: true
            });

        } catch (err) {
            console.error(err);

            await interaction.reply({
                content: 'Failed to send DM. Make sure the user ID is valid and DMs are open.',
                ephemeral: true
            });
        }
    }
};
