//
// VARIABLES
//

var express = require("express"),
    app = express(),
    mysql = require("mysql")
    bodyParser = require("body-parser"),
    expressSanitizer = require("express-sanitizer"),
    methodOverride = require("method-override");
    config = require('./Sourcefile/config')

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.set("view engine","ejs");
app.use(methodOverride('_method'));

var connection =  mysql.createConnection({
		host	: config.database.host, 
		user	: config.database.user,
		database: config.database.database,
		password: config.database.password
});

//
// ROUTES
//

app.get("/matches", function(req,res){
	var matchesq = 'SELECT * FROM matches ORDER BY match_id';
	connection.query(matchesq, function (error, results){
	if(error) throw error;
	var matches = results;
	res.render("matches.ejs", {matches:matches});
	});

});

app.get("/matches/new", function(req, res){
	res.render("new.ejs")
});


app.post("/matches", function(req,res){
	req.body.teamascore = Number(req.body.teamascore);
	if(isNaN(req.body.teamascore)){
		req.body.teamascore = 0;
	};
	req.body.teambscore = Number(req.body.teambscore);
		if(isNaN(req.body.teambscore)){
		req.body.teambscore = 0;
	};
	if(req.body.teamascore>req.body.teambscore){
		var teamApoints = 3
	} else if(req.body.teamascore == req.body.teambscore) {
		var teamApoints = 1
	} else {
		var teamApoints = 0
	};
	if(req.body.teambscore>req.body.teamascore){
		var teamBpoints = 3
	} else if(req.body.teambscore == req.body.teamascore) {
		var teamBpoints = 1
	} else {
		var teamBpoints = 0
	};
	var teamAgd = req.body.teamascore-req.body.teambscore;
	var teamBgd = req.body.teambscore-req.body.teamascore;
	var teamA = {
		"teamname" : req.body.teamaname,
		"match_against" : req.body.teambname,
		"match_goals_for" : req.body.teamascore,
		"match_goals_against" : req.body.teambscore,
		"match_points" : teamApoints,
		"match_goaldif" :  teamAgd
	};
	var teamB = {
		"teamname" : req.body.teambname,
		"match_against" : req.body.teamaname,
		"match_goals_for" : req.body.teambscore,
		"match_goals_against" : req.body.teamascore,
		"match_points" : teamBpoints,
		"match_goaldif" :  teamBgd
	};
	connection.query('INSERT INTO matches SET ?', teamA, function(err,result){
		if(err) {
			console.log(err);
		} else {
			connection.query('INSERT INTO matches SET ?', teamB, function(err,result){
				if(err) {
					console.log(err);
				} else {
					res.redirect("/matches/new")
				}
			});
		}
	});
});


//
// LISTENER
//

app.listen(3000,function(){
	console.log("Serving task list on post 3000")
})