var mongoose = require("mongoose");
var mongodb_url = process.env.MONGOLAB_URI;
var nRecents = 15;
var RecentSearchDoc;

mongoose.Promise = global.Promise;
var connection = mongoose.createConnection(mongodb_url);
exports.connection = connection;

connection.once("error",
    function(err) {
        throw new Error("Cannot open MongoDB database: " + err);
    });

connection.once("open",
    function() {
        //console.log("Connected to MongoDB on '" + mongodb_url + "'");
            
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
                RecentSearchDoc.find({$query: {}, $orderby: {_id : 1}})
                    .limit(1).exec(
                        function(err, recentSearches) {
                            if (err)
                                callback(err, null);
                            else {
                                recentSearches[0].remove(
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

exports.findRecentQueries = function findRecentQueries(callback) {
    RecentSearchDoc.find({$query: {}, $orderby: {_id : -1}})
        .limit(nRecents).exec(
            function(err, recentSearches) {
                if (err)
                    callback(err, null);
                else {
                    var ret = [];
                    
                    for (var key in recentSearches) {
                        ret.push({
                            term: recentSearches[key].term,
                            when: new Date(parseInt(recentSearches[key]._id.toString().substring(0, 8), 16) * 1000)
                        });
                    }
                    
                    callback(null, ret);
                }
            });
};