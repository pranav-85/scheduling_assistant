// utils/infoOCR.js
import { Mistral } from "@mistralai/mistralai";
import fs from "fs";

import dotenv from 'dotenv';
dotenv.config();

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

/**
 * runOCR - Extract text from an image using Mistral OCR
 * @param {Buffer|string} imageData - File buffer or Base64 string
 * @param {string} mimeType - MIME type of image ("image/png" default)
 * @returns {Promise<string>} - OCR text
 */
export async function runOCR(imageData, mimeType = "image/png") {
  try {
    let base64Image;

    if (Buffer.isBuffer(imageData)) {
      base64Image = imageData.toString("base64");
    } else if (typeof imageData === "string") {
      if (imageData.startsWith("data:")) {
        base64Image = imageData.split(",")[1];
        mimeType = imageData.match(/^data:(.*);base64,/)[1];
      } else {
        base64Image = imageData;
      }
    } else {
      throw new Error("Invalid image data. Must be Buffer or Base64 string.");
    }

    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        imageUrl: dataUrl,
      },
      includeImageBase64: true,
    });


    // Combine text from all pages
    let combinedText = ocrResponse.pages
      .map((page) => page.markdown || "")
      .join("\n\n");

      // console.log(combinedText)

    // --- CLEANING STEP ---
    // 1. Remove non-printable/control characters except line breaks
    combinedText = combinedText.replace(/[^\x20-\x7E\n]+/g, "");

    // 2. Remove pipe characters (|) which often appear in OCR artifacts
    combinedText = combinedText.replace(/\|/g, "");

    // 3. Replace multiple spaces with a single space
    combinedText = combinedText.replace(/ +/g, " ");

    // 4. Replace multiple newlines with a single newline
    combinedText = combinedText.replace(/\n+/g, "\n");

    // 4. Trim leading/trailing whitespace from each line
    combinedText = combinedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    return combinedText;
  } catch (err) {
    console.error("OCR failed:", err);
    throw err;
  }
}
