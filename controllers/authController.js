const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Неуспешно влизане!',
  successRedirect: '/',
  successFlash: 'Влязохте успешно!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'Излязохте успешно! 👋');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // first check if the user is authenticated
  if (req.isAuthenticated()) {
    next(); // carry on! They are logged in!
    return;
  }
  req.flash('error', 'Опа! Трябва да сте влезли в профила си, за да направите това!');
  res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
  // first check if the user is administrator
  if (req.user.level === 10) {
    next(); // carry on! They are admins
    return;
  }
  req.flash('error', 'Нямате достатъчно права за това!');
  res.redirect('/');
};

exports.forgot = async (req, res) => {
  // 1. See if a user with that email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'Не съществува профил с този имейл адрес');
    return res.redirect('/login');
  }
  // 2. Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();
  // 3. Send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    filename: 'password-reset',
    subject: 'Забравена парола',
    resetURL
  });
  req.flash('success', 'Получихте имейл с връзка за нулиране на паролата.');
  // 4. redirect to login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Възстановяването на паролата е невалидно или е изтекло');
    return res.redirect('/login');
  }
  // if there is a user, show the rest password form
  res.render('reset', { title: 'Забравена парола' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next(); // keepit going!
    return;
  }
  req.flash('error', 'Паролите не съвпадат!');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Възстановяването на паролата е невалидно или е изтекло');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', '💃 Супер! Вече може да използваш новата си парола! Вече си в профила си!');
  res.redirect('/');
};

exports.updateExistingPassword = async (req, res, next) => {
  const user = await User.findOne(
    { _id: req.user._id }
  );

  if (req.body.password) {
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', '💃 Супер! Вече може да използваш новата си парола!');
  }
  return next();
};
