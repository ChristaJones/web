#!/usr/bin/env nodejs

const assert = require('assert');
const mongo = require('mongodb').MongoClient;
const process = require('process');

const users = require('./model/users');
const model = require('./model/model');
const server = require('./server/server');
const opt = require('./options');

const DB_URL = 'mongodb://localhost:27017/users';

/*function getPort(argv) {
	  let port = null;
	  if (argv.length !== 3 || !(port = Number(argv[2]))) {
		      console.error(`usage: ${argv[1] PORT`);
		      process.exit(1);
		    }
	  return port;
}*/

//const opt = op.options;

mongo.connect(DB_URL).
	then(function(db){
		const model1 = new model.Model(db);
		server.serve(opt.options.port, model1, opt.options.sslDir);
	}).catch((e) => console.error(e));
