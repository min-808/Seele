var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Leaderboard sorted by wish count'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            await interaction.deferReply();

            // Placeholder embed for now
            var testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .addFields(
                {
                    name: "\n",
                    value: "\n"
                },
            )

            try {

                var client = new MongoClient(uri)

                var database = client.db("economy");
                var ids = database.collection("inventories")
                var discordID = BigInt(interaction.user.id)

                // Check how many documents are in the query (discord_id)
                var counter = await ids.countDocuments({discord_id: discordID})

                if (counter < 1) {
                    // If document not found, make a new database entry, do this for all economy commands
                    await setup.init(discordID, "economy", "inventories")
                }
                var options = {
                    projection: {
                        wish_count: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var wish_count = toParseUserUID['wish_count']

                console.log(interaction.user.id)

                const response = await fetch('https://discord.com/api/v10/users/' + '236186510326628353', {
                    headers: {
                        'Authorization': 'Bot ' + (process.env.TOKEN)
                    }
                })

                var test = JSON.stringify(await response.json(), null, 4)
                console.log(test)
                
                
                testEmbed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `ya`
                    })

                interaction.editReply({ embeds: [testEmbed] });
                await client.close()

                } catch (error) {
                    console.log(`There was an error: ${error}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
                }
        })();
    }
}