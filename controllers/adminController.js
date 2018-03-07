const mongoose = require('mongoose');

const Podcast = mongoose.model('Podcast');
const Video = mongoose.model('Video');
const User = mongoose.model('User');
const axios = require('axios');

const soundcloudStats = episode => axios.get(`http://api.soundcloud.com/tracks/${episode}?client_id=a79a1626178f3f40ae18f2a6cdba4269`)
  .then((res) => {
    const podcastStats = res.data;
    return podcastStats;
  }).catch((err) => {
    console.log(err);
  });

const youtubeStatistics = episode => axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${episode}&key=AIzaSyDlX4G4_4HN4SW0jpHxtlLfQ2gPw2zn0l0`)
  .then((res) => {
    const youtubeStats = res.data;
    console.log(res.data)
    return youtubeStats;
  }).catch((err) => {
    console.log(err);
  });

exports.adminPage = async (req, res) => {
  const videos = await Video
    .find()
    .limit(7)
    .sort({ created: 'desc' });

  const podcasts = await Podcast
    .find()
    .sort({ created: 'desc' });

  const statsPromises = podcasts.map(podcast => soundcloudStats(podcast.soundcloud));
  const stats = await Promise.all(statsPromises);

  const podcastsWithStats = podcasts.map((podcast, i) => {
    podcast.stats = stats[i];
    return podcast;
  });

  const youtubePromise = videos.map(video => youtubeStatistics(video.youtube));
  const youtubeStats = await Promise.all(youtubePromise);

  const videosWithStats = videos.map((video, i) => {
    video.youtubeStats = youtubeStats[i];
    return video;
  });

  const results = podcastsWithStats.concat(videosWithStats);
  const hearts = await User.aggregate(
    {
      $group: {
        _id: 'total-hearts',
        total: { $sum: { $size: '$hearts' } }
      },

    });


  res.render('admin', { title: 'Администрация', results, videosWithStats, podcastsWithStats, hearts });
};

exports.getVideo = async (req, res) => {
  const videos = await Video
    .find()
    .sort({ created: 'desc' });

  const statsPromises = videos.map(video => youtubeStatistics(video.youtube));
  const stats = await Promise.all(statsPromises);

  const videosWithStats = videos.map((video, i) => {
    video.stats = stats[i];
    return video;
  });
  res.render('admin-videos', { title: 'Видеа', videosWithStats });
};


exports.getPodcast = async (req, res) => {
  const podcasts = await Podcast
    .find()
    .sort({ created: 'desc' });

  const statsPromises = podcasts.map(podcast => soundcloudStats(podcast.soundcloud));
  const stats = await Promise.all(statsPromises);

  const podcastsWithStats = podcasts.map((podcast, i) => {
    podcast.stats = stats[i];
    return podcast;
  });

  res.render('admin-podcasts', { title: 'Подкасти', podcastsWithStats });
};

exports.getReviews = async (req, res) => {
  const podcasts = await Podcast
    .find()
    .sort({ created: 'desc' })
    .limit(5);

  const videos = await Video
    .find()
    .sort({ created: 'desc' })
    .limit(2);


  res.render('admin-reviews', { title: 'Подкасти', videos, podcasts });
};
