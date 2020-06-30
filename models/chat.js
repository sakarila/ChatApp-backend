const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false)

const chatSchema = mongoose.Schema({
    title: {
      type: String,
      unique: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
      }
    ]
})

chatSchema.plugin(uniqueValidator);

chatSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
    }
  })

module.exports = mongoose.model('Chat', chatSchema)