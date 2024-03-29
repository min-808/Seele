var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const checkLevel = require('../../check-level');
const buttonPagination = require('../../button-pagination')

const charSheet = require('../assets/characters.json')
const LCSheet = require('../assets/light_cones.json')
const emoteSheet = require('../assets/emotes.json')

const levelSheet = require('../assets/levels.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('characters')
    .setDescription('Check your character collection'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            try {

                var client = new MongoClient(uri)

                var database = client.db("economy");
                var ids = database.collection("inventories")
                var discordID = BigInt(interaction.user.id)

                var counter = await ids.countDocuments({discord_id: discordID})

                if (counter < 1) { // If you have an account with the bot AND you have at least one character
                    // If document not found, make a new database entry, do this for all economy commands
                    await setup.init(discordID, "economy", "inventories")
                }
                var options = {
                    projection: {
                        characters: 1,
                        missions: 1,
                        missions_completed: 1,
                    }
                }

                var toParseUserUID = await ids.findOne({discord_id: discordID}, options)
                var listOfCharacters = toParseUserUID['characters']
                
                var getMissions = toParseUserUID['missions']
                var addMissionID = []

                for (var i = 0; i < 5; i++) {
                    addMissionID.push(getMissions[i]["id"])
                }

                if ((addMissionID.includes(8)) && (getMissions[addMissionID.indexOf(8)]["completed"] == false)) { // id for characters mission
                    var mission = `missions.${addMissionID.indexOf(8)}.completed`
                    var missionSymbol = `missions.${addMissionID.indexOf(8)}.completed_symbol`

                    const setTrue = {
                        $set: {
                            [mission]: true,
                            [missionSymbol]: "✅",
                        },
                        $inc: {
                            jade_count: 75,
                            exp: 290,
                        }
                    }

                    await ids.updateOne({discord_id: discordID}, setTrue)
                }

                var levelSuccess = await checkLevel.checker(discordID, "economy", "inventories")

                if (levelSuccess) {
                    var levelEmbed = new EmbedBuilder()
                    .setColor(0x9a7ee7)
                    .addFields(
                        {
                            name: "\n",
                            value: "Your Trailblaze Level increased!\n\nClaim rewards with **/rewards** or check your level with **/profile**"
                        },
                    )
                    await interaction.channel.send({ embeds: [levelEmbed] })
                }

                var size = Object.keys(listOfCharacters).length
                var permaSize = Object.keys(listOfCharacters).length

                var showPerPage = 5

                if (size > 0) {
            
                    var pages = Math.floor(size / showPerPage)
                    if (size % showPerPage != 0) { // In case of uneven pages
                        pages += 1;
                    }

                    const embeds = []
                    var whoItsOn = ""

                    var sortedByRarity = [];

                    for (const [key] of Object.entries(listOfCharacters)) {
                        var currentCharacter = key
                        if (charSheet[currentCharacter]["rarity"] == 5) {
                            sortedByRarity.push(currentCharacter)
                        }
                    }

                    for (const [key] of Object.entries(listOfCharacters)) {
                        var currentCharacter = key
                        if (charSheet[currentCharacter]["rarity"] == 4) {
                            sortedByRarity.push(currentCharacter)
                        }
                    }

                    var getLevelValues = Object.values(levelSheet)

                    for (let i = 0; i < pages; i++) {
                        embeds.push(new EmbedBuilder().setDescription(`**Characters | Page (${i + 1}/${pages})**`)
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
                                currentCharacter = sortedByRarity[0] // Set the current character to the first one

                                if (listOfCharacters[currentCharacter]["lc"] == -1) {
                                    whoItsOn = "None"
                                } else {
                                    whoItsOn = LCSheet[listOfCharacters[currentCharacter]["lc"]]["name"]
                                }

                                embeds[i].spliceFields(j, j + 1,
                                    {
                                        name: `**${charSheet[currentCharacter]["name"]}** (${charSheet[currentCharacter]["rarity"]}${emoteSheet["Stars"]["StarBig"]["id"]})`, value: `Light Cone: **${whoItsOn}**\nLevel: **${listOfCharacters[currentCharacter]["level"]}**/${getLevelValues[4 + listOfCharacters[currentCharacter]['asc_level']]["max_level"]}\nEidolon: **${listOfCharacters[currentCharacter]["eidolon"]}**/6`
                                    }
                                )
                                sortedByRarity.shift() // Remove the first character from the array by shifting over
                            }
                            embeds[i].setFooter({text: `You have ${permaSize} characters`})
                            size -= showPerPage // Decrement
                        } else if (size < showPerPage) { // only fill as much as you need (given by size)
                            for (var h = 0; h < size; h++) {
                                currentCharacter = sortedByRarity[0]

                                if (listOfCharacters[currentCharacter]["lc"] == -1) {
                                    whoItsOn = "None"
                                } else {
                                    whoItsOn = LCSheet[listOfCharacters[currentCharacter]["lc"]]["name"]
                                }

                                embeds[i].spliceFields(h, h + 1,
                                    {
                                        name: `**${charSheet[currentCharacter]["name"]}** (${charSheet[currentCharacter]["rarity"]}${emoteSheet["Stars"]["StarBig"]["id"]})`, value: `Light Cone: **${whoItsOn}**\nLevel: **${listOfCharacters[currentCharacter]["level"]}**/${getLevelValues[4 + listOfCharacters[currentCharacter]['asc_level']]["max_level"]}\nEidolon: **${listOfCharacters[currentCharacter]["eidolon"]}**`
                                    }
                                )
                                sortedByRarity.shift()
                            }
                            embeds[i].setFooter({text: `You have ${permaSize} characters`})
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