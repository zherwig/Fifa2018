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

app.get("/", function(req,res){
	var toplist = 'SELECT ANY_VALUE(teams.printname) as team, ANY_VALUE(teams.teamowner) AS owner, ANY_VALUE(teams.teamimg) AS image, sum(match_points) AS points, sum(match_goaldif) AS goaldif FROM matches LEFT JOIN teams ON matches.teamname = teams.teamname GROUP BY teams.printname ORDER BY points DESC, goaldif DESC';
	connection.query(toplist, function (error, results){
		if(error) throw error;
		var lists = results;
		for(var i=0; i < lists.length; i++){
			var category = lists[i].team;
			lists[i].category = category.replace(" ","_");
		}
			var qmatches = 'SELECT n1.team, n1.owner, n1.teamimage, teams.printname as opponent, teams.teamowner as op_owner, teams.teamimg as op_img, n1.goals_for, n1.goals_against FROM (SELECT teams.printname as team, teams.teamowner as owner, teams.teamimg as teamimage, matches.match_against as opponent, matches.match_goals_for as goals_for, matches.match_goals_against as goals_against FROM matches LEFT JOIN teams on matches.teamname = teams.teamname) as n1 LEFT JOIN teams on n1.opponent = teams.teamname';
			connection.query(qmatches, function (error, results){
				if(error) throw error;
				var matches = results;
				res.render("home.ejs", {lists:lists, matches:matches});
			});
	});
});

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