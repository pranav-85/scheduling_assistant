import express from "express";
import multer from "multer";
import { runOCR } from "../utils/infoOCR.js";
import {
  extractEntities,
  normalizeEntities,
  combineAppointmentJson,
} from "../utils/infoExtract.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/** Health check */
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Test routes working" });
});

/** OCR test */
router.post("/ocr", upload.single("image"), async (req, res) => {
  try {
    let imageData;
    let mimeType = "image/png";

    if (req.file) {
      imageData = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.image) {
      imageData = req.body.image;
      mimeType = req.body.mimeType || "image/png";
    } else {
      return res.status(400).json({ error: "No image provided" });
    }

    const text = await runOCR(imageData, mimeType);
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OCR failed" });
  }
});

/** Entities extraction test */
router.post("/entities", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const entitiesJson = await extractEntities(text);
    res.json(entitiesJson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Entity extraction failed" });
  }
});

/** Normalization test */
router.post("/normalize", async (req, res) => {
  try {
    const { entities, timezone } = req.body;
    if (!entities) return res.status(400).json({ error: "No entities provided" });

    const normalizedJson = await normalizeEntities({ entities }, timezone || "Asia/Kolkata");
    res.json(normalizedJson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Normalization failed" });
  }
});

/** Final JSON combination test */
router.post("/final", (req, res) => {
  try {
    const { entities_json, normalized_json } = req.body;
    if (!entities_json || !normalized_json) {
      return res.status(400).json({ error: "Missing entities_json or normalized_json" });
    }

    const finalJson = combineAppointmentJson(entities_json, normalized_json);
    res.json(finalJson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to combine JSON" });
  }
});

// Export the router
export default router;
