const express = require('express');
const bodyParser = require('body-parser');

const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const SEE_OTHER = 303;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

function serve(port, model) {
          const app = express();
          app.locals.model = model;
          app.locals.port = port;
          setupRoutes(app);
          app.listen(port, function() {
              console.log(`listening on port ${port}`);
          });
}


function setupRoutes(app) {
        //Parses JSON body 
        app.use('/users', bodyParser.json());
        //Creates a new user from the given id
        app.put('/users/:id', newCompany(app));
        //Gets the user from the given id       
        app.get('/users/:id', getCompany(app));
        //Deletes the user with the given id
        app.delete('/users/:id', deleteCompany(app));
        //Updates the user with the given id
        app.post('/users/:id', updateCompany(app));
}

function requestUrl(req) {
          const port = req.app.locals.port;
          return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}

module.exports = {
          serve: serve
}
function getCompany(app) {
        return function(request, response) {
        const id = request.params.id;
        if (typeof id === 'undefined') {
                response.sendStatus(BAD_REQUEST);}
        else {
                request.app.locals.model.company.getCompany(id).
                        then((results) => response.json(results)).
                                catch((err) =>
                                        {
                                                console.error(err);
                                                response.sendStatus(NOT_FOUND);
                                        });
                }
        };
}
function deleteCompany(app) {
          return function(request, response) {
                      const id = request.params.id;
                      if (typeof id === 'undefined') {
                                    response.sendStatus(BAD_REQUEST);
                                  }
                      else {
                                    request.app.locals.model.company.deleteCompany(id).
                                        then(() => response.end()).
                                        catch((err) => {
                                                          console.error(err);
                                                          response.sendStatus(NOT_FOUND);
                                                        });
                                  }
                    };
}
function newCompany(app) {
          return function(request, response) {
                  const data = request.body;
                  const id = request.params.id;
                  if(typeof id ==='undefined'|| typeof data === 'undefined')
                  {
                        response.senStatus(BAD_REQUEST);
                  }
                else{
                        const found = request.app.locals.model.company.getCompany(id);
                        if(Object.keys(found).length !== 0)
                        {
                                request.app.locals.model.company.updateCompany(id, data).
                                        then(function(id) {
                                                response.sendStatus(NO_CONTENT);
                                        }).
                                        catch((err) => {
                                                console.error(err);
                                                response.sendStatus(SERVER_ERROR);
                                        });
                        }
                        else
                        {
                                request.app.locals.model.company.newCompany(id, data).
                                then(function(id) {
                                                response.append('Location', requestUrl(request));
                                                response.sendStatus(CREATED);
                                              }).
                                catch((err) => {
                                                console.error(err);
                                                response.sendStatus(SERVER_ERROR);
                                              });
                        }
                }
        };
}
function updateCompany(app) {
        return function(request, response) {
                const data = request.body;
                const id = request.params.id;
                if(typeof id ==='undefined'|| typeof data === 'undefined')
                {
                        response.sendStatus(BAD_REQUEST);
                }
                else{
                        request.app.locals.model.company.updateCompany(id, data).
                                then(function(id) {
                                        response.append('Location', requestUrl(request));
                                        response.sendStatus(SEE_OTHER);
                                }).
                                catch((err) => {
                                        console.error(err);
                                        response.sendStatus(SERVER_ERROR);
                                });
                }
          };
}