const multer = require('multer');
const fs = require('fs');
if (!fs.existsSync(__dirname + '/uploads')) {
  fs.mkdirSync(__dirname + '/uploads');
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + '/uploads');
  },
  filename: (req, file, cb) => {
    let id = file.originalname.split('$$')[0];
    file._id = id;
    cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });
module.exports = upload;
