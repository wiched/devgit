const mongoose = require('mongoose');

const Podcast = mongoose.model('Podcast');
const Video = mongoose.model('Video');
const User = mongoose.model('User');


exports.addVideo = (req, res) => {
  if (req.user.level === 10) {
    res.render('editVideo', { title: 'Добави Видео' });
  } else {
    req.flash('error', 'Нямате права за това');
    res.redirect('/');
  }
};

exports.createVideo = async (req, res) => {
  if (req.user.level === 10) {
    req.body.author = req.user._id;
    const video = await (new Video(req.body)).save();
    req.flash('success', `Успешно добавен ${video.name}.`);
    res.redirect(`/video/${video.slug}`);
  } else {
    req.flash('error', 'Нямате права за това');
    res.redirect('/');
  }
};

exports.delete = async (req, res) => {
  if (req.user === undefined) {
    return res.sendStatus(404);
  } else if (req.user.level === 10 && req.params.id) {
    const video = await Video.findOne({ _id: req.params.id });
    video.remove();
    req.flash('success', 'Успешно изтрихте подкаста');
    res.redirect('/videos');
    return User.update({ },
        { $pull: { hearts: { $in: [req.params.id] } } },
        { multi: true }
      );
  }
};


exports.getVideos = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 9;
  const skip = (page * limit) - limit;

  // 1. Query the database for a list of all video
  const videosPromise = Video
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Video.count();

  const [videos, count] = await Promise.all([videosPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!videos.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/videos/page/${pages}`);
    return;
  }

  res.render('videos', { title: 'Уроци', videos, page, pages, count });
};

exports.indexPage = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 6;
  const skip = (page * limit) - limit;

  // 1. Query the database for a list of all videos
  const videosPromise = Video
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const podcastsPromise = Podcast
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Video.count();

  const [videos, podcasts, count] = await Promise.all([videosPromise, podcastsPromise, countPromise]);
  const results = podcasts.concat(videos);

  const pages = Math.ceil(count / limit);

  if (!videos.length && !podcasts.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/videos/page/${pages}`);
    return;
  }

  res.render('combined', { title: 'Последни', results, videos, podcasts, page, pages, count });
};

const confirmOwner = (video, user, req, res) => {
  if (!video.author.equals(user._id) && req.user.level !== 10) {
    req.flash('error', 'Нямате права за да редактирате това.');
    res.redirect('/');
  }
};

exports.editVideo = async (req, res) => {
  // 1. Find the video given the ID
  const video = await Video.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the video
  if (req.user.level === 10) {
    confirmOwner(video, req.user, req, res);
    // 3. Render out the edit form so the user can update their video
    res.render('editVideo', { title: `Редактиране на "${video.name}"`, video });
  } else {
    req.flash('error', 'Нямате права за това');
    res.redirect('/videos');
  }
};

exports.updateVideo = async (req, res) => {
  // find and update the video
  const video = await Video.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new video instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `<strong>${video.name}</strong> е успешно обновен. <a href="/video/${video.slug}">Виж видеото →</a>`);
  res.redirect(`/ataraxia/videos/${video.id}/edit`);
  // Redriect them the video and tell them it worked
};

exports.getVideoBySlug = async (req, res, next) => {
  const video = await Video.findOne({ slug: req.params.slug }).populate('author reviews');
  if (!video) return next();
  res.render('video', { video, title: video.name });
};

exports.getVideosByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };

  const tagsPromise = Video.getTagsList();
  const videosPromise = Video.find({ tags: tagQuery });
  const [tags, videos] = await Promise.all([tagsPromise, videosPromise]);

  res.render('tag', { tags, title: 'Тагове', tag, videos });
};
