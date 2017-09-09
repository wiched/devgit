const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author!'
  },
  video: {
    type: mongoose.Schema.ObjectId,
    ref: 'Video',
    required: 'You must supply a video!'
  },
  text: {
    type: String,
    required: 'Полето за коментар е празно'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  }
});

function autopopulate(next) {
  this.populate('author').sort({ created: 'desc' });
  next();
}

reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);
