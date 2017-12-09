var express = require('express');
var mongo = require('mongodb').MongoClient;
var router = express.Router();
var async = require('async');

var User = require('../user/user');
var Messages =  require('../user/messages');

var  checkAccess=function(req,  res,  next)  {
  if  (req.session.userId)  {
    next();
  } else {
    var err = new Error("Not logged in!");
    console.log(req.session.user);
    next(err);
  }
} 

router.get('/', function (req, res, next) {
    res.sendFile('login.html', { root: 'public'});
  });


router.get('/user/content', checkAccess, function(req,res,next) {
  var json = [];
  Messages.findMessagesByUserID(req.session.userId, (error, docs)=> {
    async.forEach(docs, (element,callback) => {
      json.push([element.createdBy.name,element.text,element.url,element.createdOn])

    })
    res.json(json);
  })
});


router.get('/user/friends', checkAccess, function(req,res,next) {
  var json = [];
  User.findFriendsByUserID(req.session.userId, (error, docs)=> {
    async.forEach(docs.friends, (item,callback) => {
      json.push(item.name);
    })
    res.json(json);
  })
});

router.get('/signup', function (req, res, next) {
  res.sendFile('signup.html', { root: 'public'});
});


//signup endpoint
router.post('/signup',function (req,res,next) {
    User.checkUserExists(req,res, function (error,user){
      if (error || user) {
        res.redirect('/signup');
        error.status=400;
        next(error);
      } else {
        var newUser = {
          email: req.body.signemail,
          password: req.body.signpassword,
          name: req.body.signusername,
          friends:[],
          createdOn: Date.now()
        }; 
        User.create(newUser, function(error,createdUser) {
          if (!error){
            req.session.userId = createdUser._id;
            res.redirect('/user/profile/');
          } else {
            var error = new Error('Cannot create new user.');
            next(error);  
          }
        })
      }
    })
  })


  // Login endpoint
router.post('/login', function (req, res,next) {
    if (req.body.loginemail && req.body.loginpassword) {
        User.authenticate(req.body.loginemail, req.body.loginpassword, function (error, user) {
          if (error || !user) {
            res.redirect('/');            
            var error = new Error('Wrong email or password.');
            error.status = 401;
            next(error);
          } else {
            req.session.userId = user._id;
            res.redirect('/user/content/');
          }
        });
      }
    });

router.get('/logout', checkAccess, function(req,res,next){
  res.sendFile('logout.html', { root: 'public'});
})

// Logout endpoint
router.post('/doLogout', checkAccess, function (req, res, next) {
  if (req.session){
    req.session.destroy(function(){
        console.log("Logged out.");
      })
  res.redirect('/')};
  })

module.exports = router;
