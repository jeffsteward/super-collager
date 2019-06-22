var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {applicationName: 'Collager', title: 'Super Collager' });
});

/* GET collager page. */
router.get('/collager', function(req, res, next) {
  res.render('collager', { layout: 'collager-layout', applicationName: 'Super Collager', title: 'Hack Art Here' });
});

/* GET art board page. */
router.get('/artboard', function(req, res, next) {
  res.render('artboard', { layout: 'artboard-layout',  applicationName: 'Super Collager', title: 'Make Stuff Here' });
});

module.exports = router;
