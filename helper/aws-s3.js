const AWS = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');
const CONFIG = require('../config');
AWS.config.update({
  secretAccessKey: CONFIG.AWS.secretAccessKey,
  accessKeyId: CONFIG.AWS.accessKeyId,
});

const s3 = new AWS.S3();

const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: CONFIG.AWS.bucket,
    acl: 'public-read',
    contentType: function (req, file, cb) {
      cb(null, file.mimetype);
    },
    metadata: function (req, file, cb) {
      cb(null, { 'Content-Type': file.mimetype });
    },
    key: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
    },
  }),
});

module.exports = uploadS3;
