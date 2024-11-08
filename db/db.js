const mongoose = require('mongoose');

exports.connectDb = () => {

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

}