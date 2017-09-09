const express = require('express');

const router = express.Router();
const adminController = require('../controllers/adminController');
const functionsController = require('../controllers/functionsController');
const videoController = require('../controllers/videoController');
const podcastController = require('../controllers/podcastController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');


router.all('/*', authController.isLoggedIn, authController.isAdmin);
router.get('/', adminController.adminPage);

router.get('/videos', catchErrors(adminController.getVideo));
router.get('/podcasts', catchErrors(adminController.getPodcast));
router.get('/reviews', catchErrors(adminController.getReviews));

router.get('/videos/:id/edit', catchErrors(videoController.editVideo));
router.get('/podcasts/:id/edit', catchErrors(podcastController.editPodcast));

router.post('/delete/video/:id', catchErrors(videoController.delete));
router.post('/delete/podcast/:id', catchErrors(podcastController.delete));
router.post('/delete/review/:id/', catchErrors(reviewController.delete));

router.get('/addvideo', videoController.addVideo);
router.get('/addpodcast', podcastController.addPodcast);

router.post('/add',
  functionsController.upload,
  catchErrors(functionsController.resize),
  catchErrors(videoController.createVideo)
);

router.post('/add/:id',
  functionsController.upload,
  catchErrors(functionsController.resize),
  catchErrors(videoController.updateVideo)
);

router.post('/addpodcast',
  functionsController.upload,
  catchErrors(functionsController.resize),
  catchErrors(podcastController.createPodcast)
);

router.post('/addpodcast/:id',
  functionsController.upload,
  catchErrors(functionsController.resize),
  catchErrors(podcastController.updatePodcast)
);
module.exports = router;
