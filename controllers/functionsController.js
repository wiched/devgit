const mongoose = require('mongoose');

const Podcast = mongoose.model('Podcast');
const Video = mongoose.model('Video');
const User = mongoose.model('User');
const multer = require('multer');
const uuid = require('uuid');
const tinify = require('tinify');

tinify.key = 'zB5HmwSYSYL4hy8-7NRFPSDjGf6yQHsI';

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we compress and resize
  const photo = tinify.fromBuffer(req.file.buffer);
  const resized = photo.resize({
    method: 'fit',
    width: 800,
    height: 800
  });
  await resized.toFile(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
};


exports.searchAll = async (req, res) => {
  const podcastsQuery = Podcast
  // first find podcasts that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // the sort them
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to only 5 results
  .limit(5);

  const videosQuery = Video
  // first find videos that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // the sort them
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to only 5 results
  .limit(5);
  const [podcasts, videos] = await Promise.all([podcastsQuery, videosQuery]);
  const results = { podcasts, videos };
  res.json(results);
};

exports.getHearts = async (req, res) => {
  const videosQuery = await Video.find({
    _id: { $in: req.user.hearts }
  });
  const podcastQuery = await Podcast.find({
    _id: { $in: req.user.hearts }
  });
  const [podcasts, videos] = await Promise.all([podcastQuery, videosQuery]);
  const results = podcasts.concat(videos);
  res.render('hearted', { title: 'Любими', results });
};

exports.heartVideo = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { hearts: req.params.id } },
      { new: true }
    );
  res.json(user);
};

exports.getTopVideos = async (req, res) => {
  const videosQuery = Video.getTopVideos();
  const podcastQuery = Podcast.getTopVideos();
  const [podcasts, videos] = await Promise.all([podcastQuery, videosQuery]);
  const topVideos = podcasts.concat(videos);
  res.render('topVideos', { topVideos, title: '⭐ Топ видеа и подкасти!' });
};
