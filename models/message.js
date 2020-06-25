const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const messageSchema = mongoose.Schema({
    message: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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