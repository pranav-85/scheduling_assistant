import express from "express";
import multer from "multer";
import { runOCR } from "../utils/infoOCR.js";
import {
  extractEntities,
  normalizeEntities,
  combineAppointmentJson,
} from "../utils/infoExtract.js";

const router = express.Router();
const upload = multer(); // for multipart/form-data

// Helper to check required fields in entities/normalized
function getMissingFields(obj, requiredFields) {
  return requiredFields.filter((f) => !(f in obj));
}

// POST /appointment/parse
router.post("/parse", upload.single("image"), async (req, res) => {
  try {
    const tz = req.body.tz || "Asia/Kolkata";
    let textInput = req.body.text;

    // If image provided → run OCR
    if (req.file) {
      textInput = await runOCR(req.file.buffer, req.file.mimetype);
    }

    if (!textInput) {
      return res.status(400).json({ error: "No text or image provided" });
    }

    const entitiesJson = await extractEntities(textInput);

    const missingEntities = getMissingFields(entitiesJson.entities || {}, [
      "date_phrase",
      "time_phrase",
      "department",
    ]);

    

    if (missingEntities.length > 0 ) {
      return res.json({
        status: "failed",
        entitiesJson
      });
    }

    const normalizedJson = await normalizeEntities(entitiesJson, tz);

    
    const missingNormalized = getMissingFields(normalizedJson.normalized || {}, [
      "date",
      "time",
      "tz",
    ]);

    console.log("Missing normalized fields:", missingNormalized);

    if (missingNormalized.length > 0) {
      return res.json({
        status: "failed",
        normalizedJson
      });
    }

    const finalJson = combineAppointmentJson(entitiesJson, normalizedJson);
    res.json(finalJson);

  } catch (err) {
    console.error("Error in /appointment/parse:", err);
    res.status(500).json({ status: "failed", error: err.message });
  }
});

export default router;
