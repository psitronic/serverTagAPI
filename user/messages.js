var mongoose = require("mongoose");
var Schema = mongoose.Schema;


// tag schema
var messagesSchema = new Schema({
    //_id: {type: Schema.Types.ObjectId},
    text: { type: String, required: false},
    createdFor: {type: Array},
    url: { type: String, required: true },
    createdOn: { type: Date, 'default': Date.now },
    createdBy: {type: Schema.Types.ObjectId, ref: 'User'}
  });

messagesSchema.statics.findMessagesByUserIdURI = function(query,callback) {
  Messages.find({url:query.url,createdFor:query.userid})
  .select('createdBy createdOn text')
  .sort('createdOn')
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
