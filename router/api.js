
var express = require('express');
var mongo = require('mongodb').MongoClient;
var apiRoutes = express.Router();
var async = require('async');

var User = require('../user/user');
var Messages =  require('../user/messages');
var Groups =  require('../user/groups');
var Friends =  require('../user/friends');

var  checkAccess=function(req,  res,  next)  {
  if  (req.session.userId)  {
    next();
  } else {
    return res.json({ success: false, message: 'Session authentication failed.' });
    next(err);
  }
} 

var  checkAccessToGroup = function(req,  res,  next)  {
  if (req.query.kind === "Public") {
    req.query.item = req.session.userId;
    next();
  }
  if (req.query.kind === "User") {
    if (req.query.item === req.session.userId) {
      next();
    } else {
    User.findUsernameByUserID(req.query.item, (error,docs) => {
      if (error) {
        next(error);
      } else if (docs === null) {
        return res.json({ success: false, message: 'User does not exist.' });
        next(err);  
      } else {
        const query = {
          userId:req.session.userId,
          item:req.query.item
        }
        User.isFriend(query, (error,docs) => {
         if (error) {
           next(error);
         } else if(docs === null) {
          return res.json({ success: false, message: 'Not friends.' });
          next(err);                
         } else {
           next();
         }
        })
      }
    })
  }
  } else if (req.query.kind === "Groups") {
  Groups.findGroupByGroupID(req.query.item, (error,docs) => {
    if (error) {
      next(err);
    } else if (docs === null) {
      return res.json({ success: false, message: 'Group does not exist.' });
      next(err); 
    } else {
      const query = {
        userId:req.session.userId,
        item:req.query.item
      }
      User.isMemberOfGroup(query, (error,docs) => {
        if (error) {
          next(error);
        } else if (docs === null) {
          return res.json({ success: false, message: 'Not a group member.' });
          next(err); 
        } else {
          next(); 
        }
      })
    }
  })
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


apiRoutes.get('/getFriends', checkAccess, function(req,res,next) {
  var json = [];
  User.findFriendsByUserID(req.session.userId, (error, friends)=> {
    async.forEach(friends.friends, (friend,callback) => {
      json.push({'friendId':friend._id,'Name':friend.name});
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
      json.push({'Name':element.createdBy.name,'Created for':element.createdFor,'Message':element.text,'Date':element.createdOn})
  })
    res.json(json);
  }) 
})


apiRoutes.get('/getMessages',[checkAccess,checkAccessToGroup],function(req,res,next) {
  const json = [];
      const query = {
        'url':req.query.website,
        'createdFor.kind':req.query.kind,
        'createdFor.item':req.query.item
      }
       Messages.findMessagesForGroup(query, (error, docs) => {
         if (error) {
           next(error);
         } else if (docs.length === 0) {
          res.json({success:false, message:'No messages.'})
         } else {
        async.forEach(docs, (element,callback) => {
          json.push({'Name':element.createdBy.name,'Message':element.text,'Date':element.createdOn})
      })
        res.json(json);
    }
      })     
    })

//post messages
apiRoutes.post('/postMessages', [checkAccess,checkAccessToGroup],function (req,res,next){
  if (req.body.webtag) {
    var parsedTag = JSON.parse(req.body.webtag);
    var newTag = {
      text: parsedTag.messageText,
      createdFor:[{kind:req.query.kind,
                  item:req.query.item}],
      url: req.query.website,
      createdBy: req.session.userId
    }
    console.log(newTag);
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


// API to add a new user group
// takes userId, group name and group description
apiRoutes.post('/addGroup', checkAccess, function (req,res,next) {
  if (req.body.newGroupName) {
  Groups.findGroupByName(req.body.newGroupName, (error,group) => {
    if (group === null) {
      const newGroup = {
        groupCreatedBy:req.session.userId,
        groupName:req.body.newGroupName,
        groupDescription:req.body.newGroupDescription
      }    
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
    const query = {groupName:req.body.groupName}
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
  const json = [];
  Groups.findAllGroupsByUserID(req.session.userId, (error, docs)=> {
    async.forEach(docs, (element,callback) => {
        json.push({
          'groupId': element._id,
          'createdBy': element.groupCreatedBy,
          'Name':element.groupName,
          'Data':element.groupCreatedOn,
          'Description':element.groupDescription})
    })
    res.json(json);
  })
})
// API to get members of a group
// takes userId and name of the group
// returns an array of objects [{memberId,memberName}]
apiRoutes.get('/getGroupMembers', checkAccess, function(req,res,next) {
  if (req.query.groupName) {
    var json = [];
    var query = {userId:req.session.userId,groupName:req.query.groupName};
    Groups.findAllMembersInGroup(query, (error,group)=>{
      if (error) {
        res.json({
          success:false,
          message:'Cannot get group members.'
        })
        next(error);
      } else if (group === null) {
        res.json({
          success:false,
          message:'Group has no members.'
        })
        next();
      } else {
        async.forEach(group.groupMembers, (member,callback) => {
          json.push({
            'memberId':member.id,
            'memberName':member.name
          })
        })
        res.json(json);
      }
    })
  }
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