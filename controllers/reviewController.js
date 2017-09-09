const mongoose = require('mongoose');

const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
  req.body.author = req.user._id;
  req.body.video = req.params.id;
  const newReview = new Review(req.body);
  await newReview.save();
  req.flash('success', 'Коментарът е изпратен успешно. Благодаря за обратната връзка!');
  res.redirect(req.originalUrl);
};

exports.delete = async (req, res) => {
  if (req.user === undefined) {
    return res.sendStatus(404);
  } else if (req.user.level === 10 && req.params.id) {
    const review = await Review.findOne({ _id: req.params.id });
    req.flash('success', 'Успешно изтрихте ревюто');
    res.redirect('/ataraxia/');
    return review.remove();
  }
};

exports.getReview = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 6;
  const skip = (page * limit) - limit;

  // 1. Query the database for a list of all podcast
  const podcastsPromise = Review
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Review.count();

  const [podcasts, count] = await Promise.all([podcastsPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!podcasts.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/podcasts/page/${pages}`);
    return;
  }

  res.render('podcasts', { title: 'Подкаст', podcasts, page, pages, count });
};

const confirmOwner = (podcast, user, req, res) => {
  if (!podcast.author.equals(user._id) && req.user.level !== 10) {
    req.flash('error', 'Нямате права за да редактирате това.');
    res.redirect('/');
  }
};
