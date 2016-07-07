var mongoose = require("mongoose");
var mongodb_url = process.env.MONGOLAB_URI;
var nRecents = 15;
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

        RecentSearchDoc = connection.model("RecentSearches", recentSearchSchema);
    });
    
function insertRotating(callback) {
    var recentSearchDoc = this;
    
    RecentSearchDoc.count(
        function(err, count) {
            if (err) {
                callback(err, null);
            } else if (count >= nRecents) {
                RecentSearchDoc.find({$query: {}, $orderby: {_id : 1}},
                    function(err, data) {
                        if (err)
                            callback(err, null);
                        else {
                            RecentSearchDoc.remove({_id: data[0]._id},
                                function(err) {
                                    if (err)
                                        callback(err, null);
                                    else
                                        recentSearchDoc.save(callback);
                                });
                        }
                    });
            } else
                recentSearchDoc.save(callback);
        });
}

exports.insertQuery = function insertQuery(query, callback) {
    new RecentSearchDoc({term: query}).insertRotating(callback);
};