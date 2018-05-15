 /******************************************************
 * PLEASE DO NOT EDIT THIS FILE
 * the verification process may break
 * ***************************************************/

'use strict';

var fs = require('fs');
var express = require('express');
var mongodb = require('mongodb');
var validUrl = require('valid-url');
var ObjectId = require('mongodb').ObjectID;
var app = express();

var DBNAME = "edbrito-urls";
var COLLNAME = "urls";
var DBURL = "mongodb://"+process.env.DBUSER+":"+process.env.DBPASSWD+"@ds219040.mlab.com:19040/"+DBNAME;

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    })

app.get('/new/:url', function(req, res){
  var url = req.params.url;
  console.log("URL Original: ", url);
  if(!validUrl.isUri(url))
    res.send({error: "Invalid URL"});
  else{
    mongodb.MongoClient.connect(DBURL, function(err, client) {
    if (err){console.error(err); return err;}
    //var urls = client.db(COLLNAME);
    //var urls = db.collection('urls');
      var urls = client.collection('urls');
      
    urls.insert({orig_url: url}, function(err,docsInserted){
        console.log(docsInserted);
        res.send({shorturl: "https://somber-silver.glitch.me/v/"+docsInserted.insertedIds[0]});
        client.close();
      });
    });
  }                         
  
});

app.get('/v/:id', function(req, res){
  
  mongodb.MongoClient.connect(DBURL, function(err, client) {
    if (err){console.error(err); return err;}
    //var urls = client.db(COLLNAME);
    var urls = client.collection(COLLNAME);
    
    console.log("ID: ", req.params.id);
    urls.find(
    {
      _id: ObjectId(req.params.id)
    }).toArray(function(err, docs) {
        if (err){
          client.close();
          throw err;
        }
        console.log("Documents found: ", docs);
        if(docs.length>0){
          res.redirect(docs[0].orig_url);
        }else{
          res.send({result: "No id found"});
          client.close();
        }
    });
  });
});


// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});

