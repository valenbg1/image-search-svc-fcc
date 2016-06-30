var express = require("express");
var app = express();
var https = require("https");
var searchEngineID = process.env.SEARCH_ENGINE_ID;
var jsonCSAPIkey = process.env.JSON_CS_API_KEY;
var jsonCSAPIurl = "https://www.googleapis.com/customsearch/v1?key=" +
        jsonCSAPIkey + "&cx=" + searchEngineID;

function results(query, offset, callback) {
    https.get(jsonCSAPIurl + "&q=" + query,
        function(res) {
            res.setEncoding("utf8");
            var data = "";
            
            res.on("data", function(chunk) {data += chunk;});
            res.on("end", function() {callback(data)});
        });
}

function endStringJSON(str, res) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(str);
}

function endJSON(json, res) {
    endStringJSON(JSON.stringify(json), res);
}

function printErrorAndEnd(err, res) {
    console.error(err);
    res.end();
}

app.get("/imagesearch/:query",
    function(req, res) {
        var query = req.params.query;
        
        results(query, 0,
            function(data) {
                endStringJSON(data, res);
            });
    });

var port = process.env.PORT || 8080;
app.listen(port,
    function() {
        console.log("Node.js listening on port " + port + "...");
    });