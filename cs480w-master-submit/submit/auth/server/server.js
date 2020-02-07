const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const SEE_OTHER = 303;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

function serve(port, model, authtime, ssl) {
	const app = express();
	app.locals.model = model;
	app.locals.port = port;
	setupRoutes(app, authtime);
	https.createServer({
		key: fs.readFileSync(path.resolve(ssl, './key.pem')),//__dirname
		cert: fs.readFileSync(path.resolve(ssl,'./cert.pem')),//__dirname
	}, app).listen(port);
}

function setupRoutes(app, authtime) {
	//Parses JSON body 
	app.use('/users/:id', bodyParser.json());
	app.use('/users/:id', cacheUser(app));
	app.use('/users/:id', bodyParser.urlencoded({ extended: false}));
	//Creates a new user from the given id
	app.put('/users/:id', newUser(app, authtime));
	//Deletes the user with the given id
        app.put('/users/:id/auth', loginUser(app, authtime));
	//Gets the user from the given id       
	app.get('/users/:id', getUser(app));
}

function requestUrl(req) {
	const port = req.app.locals.port;
	return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}

module.exports = {
	serve: serve
}

/*function hello(app){
	console.log('hello');
}*/

function newUser(app, authtime){
	return function(request, response) {
		const data = request.body;
		const id = request.params.id;
		const pass = request.query.pw;
		if(typeof id ==='undefined' || typeof data === 'undefined' || typeof pass === 'undefined')
		{
			response.sendStatus(BAD_REQUEST);
		}
		else if(request.user)
		{
			//response.append('Location', requestUrl(request));
			response.status(SEE_OTHER).json({"status": "EXISTS", "info": `user <${id}> already exists`});
		}
		//Add user to DB FIX
		else
		{
			const hashpass = bcrypt.hashSync(pass, 8);
			const tok = jwt.sign({id: id}, config.secret, {expiresIn: authtime});
			response.app.locals.model.user.newUser(id, data, hashpass).
				then(function(id){
					response.append('Location', requestUrl(request));
					response.status(CREATED).json({"status": "CREATED", "authToken": tok});
				}).
				catch((err) => {
					console.error(err);
					response.sendStatus(SERVER_ERROR);
				});
		}
	};
}

function loginUser(app, authtime){
	return function(request, response){
		const id = request.params.id;
		const data = request.body;
		const pass = data.pw;
		//const valid = bcrypt.compareSync(pass, request.user.pw);
		if(typeof id === 'undefined' || typeof data === 'undefined' || typeof pass === 'undefined')
		{
			response.sendStatus(BAD_REQUEST);
		}
		//User not foundi
		else{
			const valid = bcrypt.compareSync(pass, request.user.pw);

			if(!request.user)
			{
				response.status(NOT_FOUND).json({"status": "ERROR_NOT_FOUND", "info": `user <${id}> not found`});
			}
		//Invalid password FIX
			else if(typeof pass === 'undefined' || !valid) 
			{	
				response.status(UNAUTHORIZED).json({"status": "ERROR_UNAUTHORIZED", "info": `/users/<${id}>/auth requires a valid 'pw' password query parameter`});
			}
		//valid user and password FIX
			else
			{
			//tokenize shit here
			const auth = jwt.sign({id:request.user._id}, config.secret, {expiresIn: authtime});
			response.append('Location', requestUrl(request) + '/' + auth);
			response.status(OK).json({"status": "OK", "authToken": auth});
			}
		}

	}
}

function getUser(app){
	return function(request, response, next){
      		const id = request.params.id;
		const authorization = request.get('Authorization');
		const token = authorization.split('Bearer ')[1];
		if(typeof id === 'undefined')
		{
			response.sendStatus(BAD_REQUEST);
		}
		else if(!request.user)
		{
			response.status(NOT_FOUND).json({"status": "ERROR_NOT_FOUND", "info": `user <${id}> not found`});
		}
		else if(!token)
		{
			response.status(UNAUTHORIZED).json({"status": "ERROR_UNAUTHORIZED", "info": `/users/<${id}> requires a bearer authorization header`});
		}
		else
		{
			jwt.verify(token, config.secret, function(err, decoded){
				if(err)
					response.status(UNAUTHORIZED).json({"status": "ERROR_UNAUTHORIZED", "info": `/users/<${id}> requires a bearer authorization header`});
				else
					response.json(request.user.data);
			});
		}

	}


}

function cacheUser(app){
	return function(request, response, next) {
		const id = request.params.id;
		if(typeof id === 'undefined')
		{
			response.sendStatus(BAD_REQUEST);
		}
		else
		{
			request.app.locals.model.user.getUser(id, false).
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
