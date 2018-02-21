var mongoose = require("mongoose");
var Schema = mongoose.Schema;


// friends schema
var friendSchema = new Schema({
    _id:   {type: Schema.Types.ObjectId, ref: 'User'},
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: {
        reqSentTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        reqReceivedFrom: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    }
});

// build friends model
var Friends = mongoose.model('Friends', friendSchema);
module.exports = Friends;
