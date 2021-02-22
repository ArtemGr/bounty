var github = require('octonode');
var settings =  require('./settings.js')

var ghissue_id = 2 
var ghissue_title 	= 'test issue title' 
var ghissue_body 	=  'test issue body'

var client = github.client(settings.ghtoken);
var ghrepo = client.repo(settings.ghrepo);
var ghissue = client.issue(settings.ghrepo,);

// create a test issue

ghrepo.issue({
		"title"		: 	ghissue_title,
		"body"		:	ghissue_body,
	},
	function(error,data){
		if(error){
			console.log(error)
		}
		if(data){
			console.log(data)
		}
	}
);
