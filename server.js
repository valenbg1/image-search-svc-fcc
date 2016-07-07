var express = require("express");
var app = express();
var https = require("https");
var db = require("./db.js");
var searchEngineID = process.env.SEARCH_ENGINE_ID;
var jsonCSAPIkey = process.env.JSON_CS_API_KEY;
var jsonCSAPIurl = "https://www.googleapis.com/customsearch/v1?key=" +
        jsonCSAPIkey + "&cx=" + searchEngineID;
var nResults = 10;

function imgSearch(query, offset, callback) {
    var searchUrl = jsonCSAPIurl + "&searchType=image" + "&num=" + nResults +
        "&start=" + calculateIndex(offset) + "&q=" + query;
    var req = https.get(searchUrl,
        function(res) {
            res.setEncoding("utf8");
            var data = "";
            
            res.on("data", function(chunk) {data += chunk;});
            res.once("end",
                function() {
                    //console.log(searchUrl + ":\n" + data + "\n\n");
                    data = JSON.parse(data);
                    data = data.items;
                    var ret = [];
                    
                    for (var key in data) {
                        var img = data[key];
                        
                        ret.push({
                            url: img.link,
                            mime: img.mime,
                            snippet: img.snippet,
                            thumbnail: img.image.thumbnailLink,
                            context: img.image.contextLink
                        });
                    }
                    
                    callback(ret);
                });
        });
        
    req.once("error",
        function(err) {
            console.error(err);
            callback();
        });
}

function calculateIndex(offset) {
    return (offset * nResults) + 1;
}

function endStringJSON(str, res) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(str);
}

function endJSON(json, res) {
    endStringJSON(json ? JSON.stringify(json) : "", res);
}

function printErrorAndEnd(err, res) {
    console.error(err);
    res.end();
}

app.get("/imagesearch/:query",
    function(req, res) {
        var query = req.params.query;
        var offset = req.query.offset;
        
        if (isNaN(offset) || (offset < 0))
            offset = 0;
        
        imgSearch(query, offset,
            function(data) {
                endJSON(data, res);
            });
            
        db.insertQuery(query,
            function(err) {
                if (err)
                    console.error(err);
            });
    });

app.get("/recentsearches",
    function(req, res) {
        db.findRecentQueries(
            function(err, recentSearches) {
                if (err)
                    printErrorAndEnd(err, res);
                else
                    endJSON(recentSearches, res);
            });
    });
    
if (!searchEngineID || !jsonCSAPIkey)
    throw new Error("Required env vars not set");

db.connection.once("open",
    function() {
        var port = process.env.PORT || 8080;
        app.listen(port,
            function() {
                console.log("Node.js listening on port " + port + "...");
            });
    });