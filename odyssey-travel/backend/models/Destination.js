
const mongoose = require('mongoose')

const spotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false },
)



module.exports = mongoose.model('Destination', destinationSchema)
