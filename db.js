var mongoose = require("mongoose");
var mongodb_url = process.env.MONGOLAB_URI;
var nRecents = 5;
var RecentSearchDoc;

var connection = mongoose.createConnection(mongodb_url);
exports.connection = connection;

connection.once("error",
    function(err) {
        throw new Error("Cannot open MongoDB database: " + err);
    });

connection.once("open",
    function() {
        console.log("Connected to MongoDB on '" + mongodb_url + "'");
            
        var recentSearchSchema = mongoose.Schema({
            term: {
                type: String,
                required: true,
            }
        }, {
            versionKey: false
        });
        recentSearchSchema.methods.insertRotating = insertRotating;

        RecentSearchDoc = connection.model("RecentSearchs", recentSearchSchema);
    });
    
function insertRotating(callback) {
    var recentSearchDoc = this;
    
    RecentSearchDoc.count(
        function(err, count) {
            if (err) {
                callback(err, null);
                return;
            } else if (count >= nRecents) {
                console.log(count);
            }
            
             recentSearchDoc.save(callback);
        });
}

exports.insertQuery = function insertQuery(query, callback) {
    new RecentSearchDoc({term: query}).insertRotating(callback);
};