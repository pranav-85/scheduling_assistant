const express = require("express");
const router = express.Router();
const { handleInput } = require("../controllers/inputController");
const upload = require("../middlewares/uploadMiddleware");

// POST endpoint that accepts either text or image
router.post("/appointment-info", upload.single("image"), handleInput);

module.exports = router;
