const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
mongoose.set('useCreateIndex', true);

const messageSchema = mongoose.Schema({
    message: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },
    time : { type : Date, default: Date.now }
});

messageSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
    }
});

module.exports = mongoose.model('Message', messageSchema);