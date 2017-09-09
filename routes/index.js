const express = require('express');

const router = express.Router();
const functionsController = require('../controllers/functionsController');
const videoController = require('../controllers/videoController');
const podcastController = require('../controllers/podcastController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(videoController.indexPage));
router.get('/videos', catchErrors(videoController.getVideos));
router.get('/videos/page/:page', catchErrors(videoController.getVideos));

router.get('/podcast', catchErrors(podcastController.getPodcast));
router.get('/podcast/page/:page', catchErrors(podcastController.getPodcast));

router.get('/Video/:slug', catchErrors(videoController.getVideoBySlug));
router.get('/podcast/:slug', catchErrors(podcastController.getPodcastBySlug));

router.get('/tags', catchErrors(podcastController.getPodcastsByTag));
router.get('/tags/:tag', catchErrors(podcastController.getPodcastsByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

// 1. Validate the registration data
// 2. register the user
// 3. we need to log them in
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account',
authController.confirmedPasswords,
catchErrors(authController.updateExistingPassword),
catchErrors(userController.updateAccount)
);
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

router.get('/hearts', authController.isLoggedIn, catchErrors(functionsController.getHearts));
router.post('/reviews/:id',
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);

router.get('/top', catchErrors(functionsController.getTopVideos));

/*
  Pages
*/
router.get('/about', (req, res) => { res.render('about', { title: 'За мен, Умения и Интереси' }); });
router.get('/cookie-policy', (req, res) => { res.render('cookies', { title: 'Защи и как използваме е "бисквитки"' }); });
router.get('/services', (req, res) => { res.render('services', { title: 'Услуги' }); });

/*
  API
*/

router.get('/api/search', catchErrors(functionsController.searchAll));
router.post('/api/videos/:id/heart', catchErrors(functionsController.heartVideo));
router.post('/api/podcasts/:id/heart', catchErrors(functionsController.heartVideo));

module.exports = router;
