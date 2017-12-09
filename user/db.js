var mongoose = require("mongoose");

mongoose.connect('mongodb://user1:test@ds163667.mlab.com:63667/tag', {useMongoClient: true});
//mongoose.connect(process.env.MONGODB, {useMongoClient: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;



//events handlers
db.on('connected', function () {
    console.log('connected to db');
  });
  
  db.on('error',function (err) {
    console.log('connection error: ' + err);
  });
  
  db.on('disconnected', function () {
    console.log('disconnected');
  });
  
  // tidy up connections
  process.on('SIGINT', function() {
    db.close(function () {
      console.log('disconnected through app termination');
      process.exit(0);
      });
  });  

module.exports = db;