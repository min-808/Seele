// Make sure to client.close after using this function, cuz it doesn't close here

var { MongoClient } = require("mongodb");

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    init: async function(id, db, collection) {
        var client = new MongoClient(uri)

        var database = client.db(db);
        var ids = database.collection(collection)
        var discordID = id
    
        const doc = {
            discord_id: parseInt(discordID),
            jade_count: 0,
            credits: 0,
            exp_material: 10,
            bonus_claimed: false,
            daily_timer: 0,
            assignment_level: 0,
            trailblaze_power: 240,
            max_trailblaze_power: 240,
            inventory: {},
            characters: { 
                8004: { // Trailblazer m7 dh
                    "level": 1,
                    "lc": -1,
                    "eidolon": 0
                },
                1001: {
                    "level": 1,
                    "lc": -1,
                    "eidolon": 0
                },
                1002: {
                    "level": 1,
                    "lc": -1,
                    "eidolon": 0
                }
            },
            wish_count: 0,
            four_star_pity: 0,
            five_star_pity: 0
        }
    
        const result = await ids.insertOne(doc);
        console.log(`A new entry was inserted with the _id: ${result.insertedId}`);
    }
}