var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// group schema
var groupSchema = new Schema({
    userId:{type: Schema.Types.ObjectId},
    name: { type: String},
    members: { type: Array , ref: 'User'},
    createdOn: { type: Date, 'default': Date.now }
  });

groupSchema.statics.findGroupByName = function(query,callback){
    Groups.findOne({userId:query.userId,name:query.name})
    .select('name')
    .exec(function(err,docs){
        if (err) {
            callback(err,null);
        } else
        callback(null,docs);
    })
}

groupSchema.statics.findAllGroupsByUserID = function(userid,callback) {
    Groups.find({userId:userid})
    .select('name createdOn')
    .exec(function(err, docs) {
        if (err) {
          callback(err,null);
        }
        callback(null,docs);
    }); 
}

// build group model
var Groups = mongoose.model('Groups', groupSchema);
module.exports = Groups;

