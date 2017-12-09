var express = require('express');
var mongo = require('mongodb').MongoClient;
var apiRoutes = express.Router();
var async = require('async');

var User = require('../user/user');
var Messages =  require('../user/messages');
var Groups =  require('../user/groups');

var  checkAccess=function(req,  res,  next)  {
  if  (req.session.userId)  {
    next();
  } else {
    return res.json({ success: false, message: 'Session authentication failed.' });
    next(err);
  }
} 

apiRoutes.get('/content', checkAccess, function(req,res,next) {
  var json = [];
  Messages.findMessagesByUserID(req.session.userId, (error, docs)=> {
    async.forEach(docs, (element,callback) => {
        json.push({'Name':element.createdBy.name,'Message':element.text,'URL':element.url,'Date':element.createdOn})
    })
    res.json(json);
  })
});


apiRoutes.get('/friends', checkAccess, function(req,res,next) {
  var json = [];
  User.findFriendsByUserID(req.session.userId, (error, docs)=> {
    async.forEach(docs.friends, (item,callback) => {
      json.push(item.name);
    })
    res.json(json);
  })
});

apiRoutes.get('/getMessagesByURI',checkAccess,function(req,res,next) {
  var json = [];
  var userIdURI= {userid:req.session.userId,
  url:req.headers['website']}
  Messages.findMessagesByUserIdURI(userIdURI, (error, docs) => {
    async.forEach(docs, (element,callback) => {
      json.push({'Name':element.createdBy.name,'Message':element.text,'Date':element.createdOn})
  })
    res.json(json);
  })
})

// API to add a new user group
// takes userId and group name
apiRoutes.post('/addGroup', checkAccess, function (req,res,next) {
  if (req.body.newGroupName) {
  var newGroup = {userId:req.session.userId, name:req.body.newGroupName}
  Groups.findGroupByName(newGroup, (error,group) => {
    if (group === null) {
    Groups.create(newGroup, (error,groupAdded) =>{
      if (!error) {
        res.json({
          success: true,
          message: 'New group added.'
        })    
      } else {
        res.json({
          success: false,
          message: 'Could not add a group.'
        })    
      }    
    })
  } else {
    res.json({
      success: false,
      message: 'Group already exists.'
    })    
}
  })
 } else {
    res.json({
    success: false,
    message: 'No group name specified.'
  });  
  }
})

// API to delete a user group
// takes userId and group name
apiRoutes.delete('/deleteGroup', checkAccess,function (req,res,next){
  if (req.body.groupName) {
    var query = {userId:req.session.userId, name:req.body.groupName}
    Groups.findGroupByName(query, (error,group) => {
      if (group === null || error) {
        res.json({
          success: false,
          message: 'Could not delete a group.'
      })    
      } else {
        group.remove();
        res.json({
          success: true,
          message: 'Group deleted.'
        })              
      }
    })
  } else {
    res.json({
    success: false,
    message: 'No group name specified.'
  });  
  }
})
// API to get all user's groups
// takes userId
// returns an object {'groupId','Name'}
apiRoutes.get('/getUserGroups', checkAccess,function(req,res,next) {
  var json = [];
  Groups.findAllGroupsByUserID(req.session.userId, (error, docs)=> {
    async.forEach(docs, (element,callback) => {
        json.push({'groupId': element._id,'Name':element.name,'createdOn':element.createdOn})
    })
    res.json(json);
  })
})

//post message
apiRoutes.post('/postMessage', function (req,res,next){
  if (req.body.webtag) {
    var parsedTag = JSON.parse(req.body.webtag);
    var newTag = {
      text: parsedTag.messageText,
      createdFor: parsedTag.createdFor,
      url: parsedTag.website,
      createdBy: req.session.userId
    }
    Messages.create(newTag, (error,messageCreated) => {
      if (!error) {
        res.json({
          success: true,
          message: 'Webtag posted'
        })    
      } else {
        console.log(error);
        res.json({
          success: false,
          message: 'Could not post a message.'
        })    
      }
    })
}
})

  // Login endpoint
  apiRoutes.post('/login', function (req, res,next) {
    if (req.body.loginemail && req.body.loginpassword) {
        User.authenticate(req.body.loginemail, req.body.loginpassword, function (error, user) {
          if (error || !user) {
            res.status(403)
            .json({
            success: false,
            message: 'Authentication failed'});
            next(error);
          } else {
            req.session.userId = user._id;
            res.json({
                success: true,
                message: 'Session is alive!',
                userId: req.session.userId});
          }
        });
      }
    });

// Logout endpoint
apiRoutes.post('/logout', checkAccess, function (req, res, next) {
    if (req.session){
      req.session.destroy(function(){
        res.json({success: true,
            message: "Logged out."});
        })
    } else {
    res.json({success: false,
    message: "Could not logout."})
    }
    })

module.exports = apiRoutes;