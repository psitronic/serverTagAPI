// init project
//const      mongo = require('mongodb').MongoClient;
 
var bodyParser = require('body-parser');
var path = require('path');
var express = require('express'),
    app = express(),
    session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require("mongoose");
var db = require('./user/db');
var User = require('./user/user');
var routes = require('./router/router');
var apiRoutes = require('./router/api');
      
// create a session with a session ID
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
  mongooseConnection: db
  })
}));
      
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);
app.use('/', routes);      

// simple login endpoint to send simple data
app.post("/loginjson", (req,res)=>{
      console.log("request", req.body)
        
            findUser(req.body.email,req.body.password, (result)=>{
               if (result){
                 res.header("Access-Control-Allow-Origin","*")
                 res.header("Access-Control-Allow-Headers","X-Requested-With")
                 res.send(result)
                 res.end()
                 
               } else res.sendStatus(401)
              
            });
      
      
  
      
  
})


var listener = app.listen(3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});



//tryMlab() 
function tryMlab(){
     
     mongo.connect(process.env.MONGODB, function(er, db){
           if (er) {throw er
           } else {
             
             //console.log("db", db)
             
             db.collection('users').find({}).toArray(function(er, docs){
                   if (er) {throw er
                   } else { 
                         
                         console.log('docs', docs);
                         
                         db.close();
                   }
                 
             })
           }
       
     })   
  
}

// previously known as  mongooseMlab
function findUser(email, pass, cb) {
  
  //let users
  
  
  
  User.find({email: email, password: pass},function(error, docs) {
      if (error) throw error;
      else{  
        console.log("mongoose found docs:", docs);
        
        if (Array.isArray(docs) && docs.length === 0){ 
            //throw new Error("no database entry")
            if (cb) cb(null)
        } else{
        
          docs = docs[0].toObject()
         //console.log("mongoose found:", docs[0].toObject().name);
        console.log("mongoose found:", docs.name);
        /*for (var props in docs[0]){
            console.log(props)
        }*/
         //users = docs
         if (cb) cb({name: docs.name})
        }
      }
  });
}