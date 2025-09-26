const multer = require("multer");

// Memory storage (keeps file in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = upload;
