const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const slug = require('slugs');

const podcastSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a video name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: {
    type: [String],
    ref: 'Video',
  },
  created: {
    type: Date,
    default: Date.now
  },
  photo: String,
  type: {
    type: String,
    default: 'Podcast'
  },
  podcast: {
    type: String,
    trim: true
  },
  soundcloud: {
    type: String,
    required: 'Въведете връзка от SoundCloud',
    trim: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define our indexes
podcastSchema.index({
  name: 'text',
  description: 'text'
});


podcastSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of wes, wes-1, wes-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const videosWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (videosWithSlug.length) {
    this.slug = `${this.slug}-${videosWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

podcastSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags', },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

podcastSchema.statics.getTopVideos = function() {
  return this.aggregate([
    // Lookup Stores and populate their reviews
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'video', as: 'reviews' } },
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // Add the average reviews field
    { $project: {
      photo: '$$ROOT.photo',
      name: '$$ROOT.name',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.slug',
      type: '$$ROOT.type',
      averageRating: { $avg: '$reviews.rating' }
    } },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 } },
    // limit to at most 10
    { $limit: 5 }
  ]);
};

// find reviews where the stores _id property === reviews store property
podcastSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the store?
  foreignField: 'video' // which field on the review?
});

// find reviews where the videos _id property === user hearts property
podcastSchema.virtual('liked', {
  ref: 'User', // what model to link?
  localField: '_id', // which field on the Podcast?
  foreignField: 'hearts' // which field on the User?
});

function autopopulate(next) {
  this.populate('reviews');
  this.populate('liked');
  next();
}

podcastSchema.pre('find', autopopulate);
podcastSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Podcast', podcastSchema);
