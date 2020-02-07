'use strict';
const assert = require('assert');
const mongo = require('mongodb').MongoClient;
//used to build a mapper function for the update op.  Returns a
//function F = arg => body.  Subsequently, the invocation,
//F.call(null, value) can be used to map value to its updated value.
function newMapper(arg, body) {
  return new (Function.prototype.bind.call(Function, Function, arg, body));
}
//print msg on stderr and exit.
function error(msg) {
  console.error(msg);
  process.exit(1);
}
//export error() so that it can be used externally.
module.exports.error = error;
//auxiliary functions; break up your code into small functions with
//well-defined responsibilities.
//perform op on mongo db specified by url.
function dbOp(url, op) {
  //your code goes here
        var obj = JSON.parse(op);
        switch(obj.op)
        {
                case "create":
                        //console.log()
                        mongo.connect(url, function(err, db){
                                assert.equal(null, err);
                                create(db, obj, function(){
                                        db.close();
                                });
                        });
                        break;
                case "read":
                        mongo.connect(url, function(err, db){
                                assert.equal(null, err);
                                read(db, obj, function(){
                                        db.close();
                                });
                        });
                        break;
                case "update":
                        mongo.connect(url, function(err, db){
                                assert.equal(null, err);
                                update(db, obj, function(){
                                         db.close();
                                });
                        });
                        console.log("trying to update");
                        break;
                case "delete":
                        mongo.connect(url, function(err, db){
                                assert.equal(null, err);
                                delet(db, obj, function(){
                                db.close();
                                })
                        });
                        break;
                default:
                        console.log("wrong option");
        }
}
function create(db, obj, callback){
var array, size;
//checks for arguments
var data;
var i;
if(obj.args)
{
        array = obj.args;
        size = array.length
        if (undefined === size)
        {
                data = db.collection(obj.collection).findOne(obj.args,
                        function(err, result){
                                assert.equal(err, null);
                                callback();
                        }
                );
                if(data == null)
                {
                        db.collection(obj.collection).insertOne(obj.args,
                                function(err, result){
                                assert.equal(err, null);
                                callback();
                                }
                        );
                }
        }
        else
        {
                for(i = 0; i<size; i++)
                {
                //looks for argument to see if they are already in the collection
                data = db.collection(obj.collection).findOne(obj.args[i],
                function(err, result){
                        assert.equal(err, null);
                        callback();
                        }
                );
                //if argument is not in the collection it is added
                if(data == null)
                {
                        //console.log(data);
                        db.collection(obj.collection).insertOne(obj.args[i],
                                function(err, result){
                                        assert.equal(err, null);
                                        callback();
                                }
                        );
                }
                //console.log(data);
                }
        }
        db.close();
}
}
function read(db, obj,  callback){
var array, size;
var data;
var i;
if(undefined === obj.args)
{
        array = obj.args;
        size = array.length;
        if(undefined === size)
        {
                db.collection(obj.collection).find(obj.args).toArray(
                        function(err, result)
                        {
                                if (err) throw err;
                                console.log(result);
                                db.close();
                        }
                );
        }
        else
        {
                for(i = 0; i<size; i++)
                {
                        //looks for argument to see if they are already in the collectioin
                        db.collection(obj.collection).find(obj.args[i]).toArray(
                                function(err, result)
                                {
                                        if (err) throw err;
                                        console.log(result);
                                        db.close();
                                });
                }
        }
}
else
{
        db.collection(obj.collection).find({}).toArray(
                function(err, result)
                    {
                            if (err) throw err;
                                console.log(result);
                            db.close();
                    });
}
}

function update(db, obj, callback)
{
var size, array;
var data;
var i;
var imTheMap = new newMapper(obj.fn[0], obj.fn[1]);
var thing;
        var b;
if(undefined === obj.args)
{
        array = obj.args;
        size = array.length;
        if(undefined === size)
        {
                data = db.collection(obj.collection).findAndModify(query: obj.args,update:imTheMap(null,
                                function(err, result)
                                {
                                        if (err) throw err;
                                        thing = imTheMap(null, result);
                                        console.log(thing);
                                        db.close();
                                }
                );
        }
        else
        {
                for(i = 0; i<size; i++)
                {
                        //looks for argument to see if they are already in the collectioin
                        data = db.collection(obj.collection).find(obj.args[i]).toArray(
                                function(err, result)
                                {
                                        if (err) throw err;
                                        thing = imTheMap(null, result);
                                        console.log(thing);
                                        db.close();
                                }
                        );
                }
        }
}
else
{
        thing = imTheMap.call(null);
        console.log(thing);
        db.close();
}
db.close();
}
function delet(db, obj, callback){
var array, size;
//checks if arguments were given
var data;
var i;
if(undefined === obj.args)
{
        array = obj.args;
        size = array.length;
        if(undefined === size)
        {
                data = db.collection(obj.collection).find(obj.args);
                if(data)
                {
                        db.collection(obj.collection).deleteOne(obj.args,
                                function(err, result){
                                assert.equal(err, null);
                                callback();
                                });
                }
        }
        else
        {
                //iterates through the arguments
                for(i = 0; i<size; i++)
                {
                        //finds the srgument to see if its in the collection
                        data = db.collection(obj.collection).findOne(obj.args[i]);
                        //if in the collection it gets deleted
                        if(data != null)
                        {
                               db.collection(obj.collection).deleteOne(obj.args[i],
                                       function(err, result){
                                        assert.equal(err, null);
                                            callback();
                                       });
                        }
                }
                db.close();
        }
}
else
{
        //deletes entire coillection
        db.collection(obj.collection).drop();
        db.close();
}
}
//make main dbOp() function available externally
module.exports.dbOp = dbOp;