const multer = require("multer");

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {

  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);

  } else {

    cb(
      new Error("Only images are allowed"),
      false
    );
  }
};

const upload = multer({

  storage,

 limits: {
  fileSize: 10 * 1024 * 1024, // 10MB
},

  fileFilter,

});

module.exports = upload;