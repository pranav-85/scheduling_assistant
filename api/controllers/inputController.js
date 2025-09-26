// If you want, you can put your logic in utils/yourLogic.js
// const processInput = require("../utils/yourLogic");

const handleInput = async (req, res) => {
  try {
    let result;

    if (req.file) {
      // Image input
      const imageBuffer = req.file.buffer;
      // Call your image-processing logic here
      result = { type: "image", message: "Image received", size: imageBuffer.length };
    } else if (req.body.text) {
      // Text input
      const text = req.body.text;
      // Call your text-processing logic here
      result = { type: "text", message: "Text received", text: text };
    } else {
      return res.status(400).json({ error: "No input provided" });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { handleInput };
