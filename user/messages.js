var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//var User = require('./user');

// tag schema
var messagesSchema = new Schema({
    //_id: {type: Schema.Types.ObjectId},
    text: { type: String, required: false},
    createdFor: [{
      kind: String,
      item: {type: Schema.Types.ObjectId, refPath:"createdFor.kind"}
    }],
    url: { type: String, required: true },
    createdOn: { type: Date, 'default': Date.now },
    createdBy: {type: Schema.Types.ObjectId, ref: 'User'}
  });

messagesSchema.statics.findMessagesForGroup = function(query,callback) {
   Messages.find(query)
  .select('createdFor createdBy createdOn text')
  .sort('createdOn')
  .populate('createdFor.item')
  .populate('createdBy', 'name')
  .exec(function(err,docs) {
    if (err) {
      callback(err,null);
    }
    callback(null,docs);
  })
}

//find doc in messages by userID
messagesSchema.statics.findMessagesByUserID = function(userid,callback) {
  Messages.find({createdFor: userid})
    .select('createdBy createdOn text url')
    .sort('createdOn')
    .populate('createdBy', 'name')
    .exec(function(err, docs) {
      if (err) {
        callback(err,null);
      }
      callback(null,docs);
    })
}

// build tag model
var Messages = mongoose.model('Messages', messagesSchema);
module.exports = Messages;
