var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const buttonPagination = require('../../button-pagination')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

let choices = ["wish_count", "credits", "jade_count", "calyx_level", "assignment_level", "level"]

module.exports = {
    data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('The global leaderboard sorted by wish count')
    .addStringOption((option) =>
        option
            .setName("sort_by")
            .setDescription("Select what you want to sort by")
            .setRequired(true)
            .setAutocomplete(true)
    ),

    async autocomplete (interaction) {

        const value = interaction.options.getFocused()

        const filtered = choices.filter(choice => choice.toLowerCase().includes(value));

        if (!interaction) return;

        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    },

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            try {

                var client = new MongoClient(uri)

                var database = client.db("economy");
                var ids = database.collection("inventories")

                var options = {
                    projection: {
                        _id: 0,
                        discord_id: 1,
                        wish_count: 1,
                        credits: 1,
                        jade_count: 1,
                        calyx_level: 1,
                        assignment_level: 1,
                        level: 1,
                    }
                }

                var selectedOption = interaction.options.get("sort_by").value

                if (!(choices.includes(selectedOption))) {
                    var testEmbed = new EmbedBuilder()
                        .setColor(0x9a7ee7)
                        .addFields(
                            { name: "\n", value: "Invalid option" }
                        )
                        
                        await interaction.deferReply()
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                } else { // Valid option

                    var countType;

                    switch (selectedOption) {
                        case "wish_count":
                            countType = "Wishes"
                            break
                        case "credits":
                            countType = "Credits"
                            break
                        case "jade_count":
                            countType = "Stellar Jade"
                            break
                        case "level":
                            countType = "TL"
                            break
                        default:
                            countType = ""
                    }

                    var listOfDocuments = await ids.find( {}, options ).toArray()

                    listOfDocuments.sort((a, b) => (a[selectedOption] < b[selectedOption]) ? 1 : ((b[selectedOption] < a[selectedOption]) ? -1 : 0))
    
                    for (var x = 0; x < listOfDocuments.length; x++) { // Converting discord_id to their username
                        var foundID = listOfDocuments[x].discord_id
    
                        const response = await fetch(`https://discord.com/api/v10/users/${foundID}`, {
                            headers: {
                                'Authorization': 'Bot ' + (process.env.TOKEN)
                            }
                        })
    
                        var parse = await response.json()
                        var returnedUsername = String(parse?.["username"])
                        var returnedDiscriminator = String(parse?.["discriminator"])
    
                        if (returnedDiscriminator != 0) { // In case their username still has a number (#)
                            returnedUsername += `#${returnedDiscriminator}`
                        }
                        
                        listOfDocuments[x].discord_id = returnedUsername
                    }
    
                    var size = listOfDocuments.length
                    var permaSize = listOfDocuments.length
    
                    var showPerPage = 5
                    var totalCount = 1 // Keeps track of ranking numbers
                
                    var pages = Math.floor(size / showPerPage)
                    if (size % showPerPage != 0) { // In case of uneven pages
                        pages += 1;
                    }
    
                    const embeds = []
    
                    for (let i = 0; i < pages; i++) {
                        embeds.push(new EmbedBuilder().setDescription(`**Leaderboard | Page (${i + 1}/${pages})**`)
                        .setColor(0x9a7ee7)
                        .addFields(
                            { name: "\n", value: "\n" },
                            { name: "\n", value: "\n" },
                            { name: "\n", value: "\n" },
                            { name: "\n", value: "\n" },
                            { name: "\n", value: "\n" }
                        )
                        )
    
                        if (size >= showPerPage) { // fill the page!
                            
                            for (var j = 0; j < showPerPage; j++) {
                                var currentPlayer = listOfDocuments[0].discord_id // Set the current item to the last one
                                var currentWishCount = listOfDocuments[0][selectedOption]
    
                                embeds[i].spliceFields(j, j + 1,
                                    {
                                        name: `\n`, value: `${totalCount}. **${currentPlayer}** - ${currentWishCount} ${countType}`
                                    }
                                )
                                totalCount++
                                listOfDocuments.shift() // Remove the first item from the array
                            }
                            embeds[i].setFooter({text: `There are ${permaSize} players`})
                            size -= showPerPage // Decrement
                        } else if (size < showPerPage) { // only fill as much as you need (size)
                            for (var h = 0; h < size; h++) {
                                var currentPlayer = listOfDocuments[0].discord_id // Set the current item to the last one
                                var currentWishCount = listOfDocuments[0][selectedOption]
    
                                embeds[i].spliceFields(h, h + 1,
                                    {
                                        name: `\n`, value: `${totalCount}. **${currentPlayer}** - ${currentWishCount} ${countType}`
                                    }
                                )
                                totalCount++
                                listOfDocuments.shift()
                            }
                            embeds[i].setFooter({text: `There are ${permaSize} players`})
                            size = 0
                        }
                    }
    
                    await buttonPagination(interaction, embeds)
                    await client.close()
                }
            } catch (error) {

                console.log(`There was an error: ${error.stack}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }
        })();
    }
}