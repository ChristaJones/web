#!/usr/bin/env nodejs

'use strict';

const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const mustache = require('mustache');
const cookieParser = require('cookie-parser');
const process = require('process');
//const validator = require('express-validator');
//const session = require('express-session');

const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const SEE_OTHER = 303;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

function serve(port, model, ssl) {
	process.chdir(__dirname);
	const app = express();
	app.use(cookieParser());
	app.locals.model = model;
	//setupTemplates(app);
	app.locals.port = port;
	app.use(express.static(path.join(__dirname, 'templates')));
	app.set('templates', __dirname + '/templates');
	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');
	app.use(bodyParser.urlencoded({extended: false}));
	//app.use(validator());
	//app.use(session({secret: 'srt', saveUninitalized: false, resave:false}));
	setupRoutes(app);
	const options = {
		        key: fs.readFileSync(path.resolve(ssl, './key.pem')),//__dirname
		        cert: fs.readFileSync(path.resolve(ssl,'./cert.pem')),//__dirname
	};
	https.createServer(options
		//response.write('index.html');
	,app).listen(port);
}


function setupRoutes(app) {
        app.use('/', bodyParser.json());
        app.use('/', cacheUser(app));
	app.get('/', redirectPage(app));
	app.get('/index.html', homePage(app));
	app.get('/login.html', loginPage(app));
	app.post('/loginsubmit',loginSubmit(app));
	app.get('/registration.html', registrationPage(app));
	app.post('/registrationsubmit', registrationSubmit(app));
	app.post('/account', account(app));
	app.get('/account.html', accountPage(app));
}
/*path.resolve(__dirname, './style.css')
function setupTemplates(app){
	app.templates = {};
	for(let fname of fs.readdirSync(path.resolve(__dirname, './style.css')) {
		    const m = fname.match(/^([\w\-]+)\.ms$/);
		    if (!m) continue;
		    try {
			          app.templates[m[1]] =
				    	String(fs.readFileSync(`${path.resolve(__dirname, './style.css')}/${fname}`));
			        }
		    catch (e) {
			          console.error(`cannot read ${fname}: ${e}`);
			          process.exit(1);
			        }
		  }
}*/

function requestUrl(req) {
	const port = req.app.locals.port;
	return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}

module.exports = {
	serve: serve
}	

function redirectPage(app){
	return function(request, response){
		response.redirect('index.html');
	};
}

function homePage(app){
	return function(request, response, next){
		response.render('index.html');
		/*document.getElementById("login").onclick = function () {
			        login(app);
				console.log('we log in now');
			    };*/
		/*document.getElementById("register").onclick = function () {
			        response.redirect('registration.html');
			    };*/
	};
}

function accountPage(app){
	return function(request, response, next){
	response.render('account.html');
	};
}

function account(app){
	        return function(request, response, next){
			//console.log(request.user.data.fname);
			var data = {"fname": request.user.data.firstname, "lname" : request.user.data.lastname};
			app.templates = String(fs.readFileSync(path.resolve(__dirname, './templates/account.html')));
			var view = mustache.render(app.templates, data);
			response.send(view);
		};
}


function loginPage(app){
	return function(request, response, next){
		var error = {"label": " ", "error" : " "};
		app.templates = String(fs.readFileSync(path.resolve(__dirname, './templates/login.html')));
		mustache.parse(app.templates);
		var view = mustache.render(app.templates, error);
		response.send(view);		
		//request.check('email', 'Invalid email address').isEmail();
	};
}

function loginSubmit(app){
	return function(request, response, next){
		const data = request.body;
		const email = data.email;
		const password = data.password;
		//console.log(password);
		var error = {"label": "8 ", "error" : "* "};
		const valid = bcrypt.compareSync(password, request.user.data.pass);
		 app.templates = String(fs.readFileSync(path.resolve(__dirname, './templates/login.html')));
		//User not found
		if(!request.user){
			error = {"label": "Error Message:", "error" : "No user has registered with this email address"};
			mustache.parse(app.templates);
			var view = mustache.render(app.templates, error);
			response.send(view);
		}
		//Passwords dont match
		else if(!valid)
		{
			error = {"label": "Error Message: ", "error" : "Incorrect Password"};
			mustache.parse(app.templates);
			var view = mustache.render(app.templates, error);                                               
			response.send(view);
		}
		else
		{
			var info = {"fname": request.user.data.firstname, "lname" : request.user.data.lastname};
			app.templates = String(fs.readFileSync(path.resolve(__dirname, './templates/account.html')));
			var view = mustache.render(app.templates, info);
			response.send(view);//return response.redirect('/account.html');
		}	
		
	};

}

function registrationPage(app){
	return function(request, response, next){
		 var error = {"label": " ", "error" : " "};
		app.templates = String(fs.readFileSync(path.resolve(__dirname, './templates/registration.html')));
		var view = mustache.render(app.templates, error);
		response.send(view);
		//return response.render('registration.html');
	};
}

function registrationSubmit(app){
	return function(request, response, next){
		//console.log('running this fucntion');
		var data = request.body;
		const email = data.email;
		const password = data.password;
		const repassword = data.repassword;
		const first = data.firstname;
		const last = data.lastname;
		var error = {"label": " ", "error" : " "};
		/*console.log(data.firstname);
		console.log(password);
		console.log(repassword);*/
		app.templates = String(fs.readFileSync(path.resolve(__dirname, './templates/registration.html')));
		//User found
		if(request.user){
			error = {"label": "Error Message: ", "error": "User already exists with this email"};
			mustache.parse(app.templates);
			var view = mustache.render(app.templates, error);
			response.send(view);
			//next('/registration.html');
		}
		//Passwords dont match
		else if(password !== repassword)
		{
			error = {"label" :"Error Message: ", "error": "Passords do not match"};
			mustache.parse(app.templates);
			var view = mustache.render(app.templates, error);
			response.send(view);
			//next('/registration.html');
		}
		else
	        {
			const hashpassword = bcrypt.hashSync(password, 8);
			//const tok = jwt.sign(requst.user.id, config.secret, expires
			data.pass = hashpassword;
			//const data = request.body;
			response.app.locals.model.user.newUser(data).
				then(function(data){
				var info = {"fname": first, "lname" : last};
					app.templates = String(fs.readFileSync(path.resolve(__dirname, './templates/account.html')));
					var view = mustache.render(app.templates, info);
					response.send(view);//	return	response.redirect('/index.html');
				}).
				catch((err) => {
					console.error(err);
					//response.sendStatus(SERVER_ERROR);
				});
		}
		      	
	};
}	

function cacheUser(app){
	return function(request, response, next) {
		const email = request.body.email;
		if(typeof email === 'undefined')
		{
			response.sendStatus(BAD_REQUEST);
		}
		else
		{
			request.app.locals.model.user.getUser(email, false).
				then(function(user){
					request.user = user;
					next();
				}).
				catch((err) => {
					console.error(err);
					response.sendStatus(SERVER_ERROR);
				});
		}
	}
}


function doMustache(app, templateId, view) {
	  const templates = { footer: app.templates.footer };
	  return mustache.render(app.templates[templateId], view, templates);
}

function errorPage(app, errors, res) {
	  if (!Array.isArray(errors)) errors = [ errors ];
	  const html = doMustache(app, 'errors', { errors: errors });
	  res.send(html);
}

