var github = require('octonode');
var settings =  require('./settings.js')

var ghissue_id = settings.ghissue
var ghissue_title 	= 'test issue title' 
var ghissue_body 	=  'test issue body update'

var client = github.client(settings.ghtoken);
var ghissue = client.issue(settings.ghrepo, ghissue_id);

//issue update
ghissue.update({
		"title"	: 	ghissue_title,
		'body'	:	ghissue_body,
	},function(error,data){
		if(error){
			console.log(error)
		}else{
			console.log(data)
		}
	}
);