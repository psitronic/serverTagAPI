var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

// user schema
var userSchema = new Schema({
    //_id:   {type: Schema.Types.ObjectId},
    email: { type: String},
    password: { type: String},
    name: { type: String, unique: true},
    groups:[{type: String}],
    friends: { type: Array },
    createdOn: { type: Date, 'default': Date.now }
  });

//find username in user by userID
userSchema.statics.findUsernameByUserID = function(userid,callback) {
    User.findOne({_id: userid})
      .select('name')
      .exec(function(err, docs) {
          if (err) {
              callback(err,null);
            }
        callback(null,docs.name);
      })
    }

//find friends in User by userID
userSchema.statics.findFriendsByUserID = function(userid,callback) {
    User.findOne({_id: userid})
    .select('friends')
    .sort('name')
    .populate('friends', 'name')
    .exec(function(err, docs) {
        if (err) {
          callback(err,null);
        }
        callback(null,docs);
});
}

//find friends in User by userID
userSchema.statics.isFriend = function(query,callback) {
    User.findOne({_id: query.userId, friends:query.item})
    .select('friends')
    .populate('friends', 'name')
    .exec(function(err, docs) {
        if (err) {
          callback(err,null);
        }
        callback(null,docs);
});
}


//check new user
userSchema.statics.checkUserExists = function(req,res,callback) {
    User.findOne({email:req.body.signemail}||{username:req.body.signusername})
    .exec(function(error,user){
        if (!user){
            if (req.body.signpassword !== req.body.signpasswordconfirm){
                var error = new Error("Password in two fields should be the same.");
                callback(error);
            } else {
                callback(null,user);
            }
        } else {
            var error = new Error("User or email already exists");
            callback(error);
    }
})
}

userSchema.statics.isMemberOfGroup = function(query,callback) {
    User.findOne({_id:query.userId,groups:query.item})
    .exec(function(error,docs){
      if (error) {
        callback(err,null);
      } else {
        callback(null,docs);
      }

    })

}

//check input and DB 
userSchema.statics.authenticate = function(email,password,callback) {
    User.findOne({email:email})
    .exec(function(error,user){
        if (!user){
            var error = new Error("User not found");
            return callback(error);
        }
        //if (password === user.password) {
        //    return callback(null,user);
        //} else {
        //    return callback;
        //}
        bcrypt.compare(password,user.password,function(error,result){
            if (result === true){
                console.log("Encryption");
                return callback(null,user);
            } else {
               return callback;
            }
        });
    });
};

userSchema.pre('save',function(next){
    var user = this;
    bcrypt.genSalt(10, function(error, salt) {
        if (error) return next(error);
        bcrypt.hash(user.password,salt,function(error,hash){
            if (error) return next(error);
            user.password = hash;
            next();
        })
    })
})

// build user model
var User = mongoose.model('User', userSchema);
module.exports = User;


