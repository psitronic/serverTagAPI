var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// group schema
var groupSchema = new Schema({
    groupCreatedBy:{type: Schema.Types.ObjectId, ref: 'User'},
    groupName: { type: String},
    groupDescription: {type: String},
    groupMembers: [{ type: Schema.Types.ObjectId , ref: 'User'}],
    groupCreatedOn: { type: Date, 'default': Date.now }
  });

groupSchema.statics.findGroupByName = function(query,callback){
    Groups.findOne({groupCreatedBy:query.groupCreatedBy,groupName:query.groupName})
    .select('groupName')
    .exec(function(err,docs){
        if (err) {
            callback(err,null);
        } else
        callback(null,docs);
    })
}

groupSchema.statics.findAllGroupsByUserID = function(groupCreatedBy,callback) {
    Groups.find({groupCreatedBy:groupCreatedBy})
    .select('groupCreatedBy groupName groupDescription groupCreatedOn')
    .sort('groupName')
    .populate('groupCreatedBy', 'name')
    .exec(function(err, docs) {
        if (err) {
          callback(err,null);
        }
        callback(null,docs);
    }); 
}

groupSchema.statics.findAllMembersInGroup = function(query,callback) {
    Groups.findOne({groupCreatedBy:query.userId,groupName:query.groupName})
    .select('groupMembers')
    .populate('groupMembers', 'name')
    .exec(function(err, docs) {
        if (err) {
            callback(err, null);
        }
        callback(null,docs)
    })
}

// build group model
var Groups = mongoose.model('Groups', groupSchema);
module.exports = Groups;

