// import OpenAI from "openai";
import { Mistral } from "@mistralai/mistralai";
import { DateTime } from "luxon";

import dotenv from 'dotenv';
dotenv.config();

// Initialize OpenAI client
const client = new Mistral(
  process.env.MISTRAL_API_KEY, // your key
  );

/**
 * Extract entities JSON from text using Mistral model via OpenAI SDK
 * Safely handles extra text outside JSON
 * @param {string} text
 * @returns {Promise<Object>} parsed JSON
 */
export async function extractEntities(text) {
  try {
    const prompt = `
You are an information extraction system.

Your task: extract structured entities from the given text.

Text: "${text}"

Entities to extract:
- date_phrase → words/phrases indicating date of appointment/meeting in the text
- time_phrase → words/phrases indicating time of appointment/meeting in the text
- department → appointment type/department mentioned in the text

Output requirements:
- Return a valid JSON object only, no explanations.
- JSON schema:
{
  "entities": {
    "date_phrase": "<string or null>",
    "time_phrase": "<string or null>",
    "department": "<string or null>"
  },
  "entities_confidence": <float between 0 and 1>
}
- Extract only the information present in the text. DO NOT MAKE ASSUMPTIONS.
- Use null if an entity is not found.
- Confidence should be a float (0.0 = not confident, 1.0 = very confident).
- Do not include extra text outside JSON.
`;

    const response = await client.chat.complete({
      model: "mistral-small", // Mistral model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
    });

    const rawText = response.choices[0].message.content;

    // Extract JSON block from raw text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in model output");

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Error extracting entities:", err);
    throw err;
  }
}

/**
 * Normalize extracted entities using Mistral model
 * @param {Object} entitiesJson
 * @param {string} tz
 * @returns {Promise<Object>} Normalized JSON or Guardrail JSON
 */
export async function normalizeEntities(entitiesJson, tz = "Asia/Kolkata") {
  try {
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat("EEEE, dd LLLL yyyy");
    const utcOffset = now.toFormat("ZZ");

    const prompt = `
You are an Information Normalizer.

### Instructions
- Input: extracted entities in JSON.
- Output: strictly one JSON object.
- **If ambiguous (e.g., "Monday" without specifying this/next, or "afternoon" without an exact time), output the Guardrail JSON.**
- Never guess or assume values.
- Do NOT add explanations, text, or commentary. Only output the JSON.

### Input Entities
${JSON.stringify(entitiesJson)}

### Reference Context
- Today's date: ${todayStr}
- Timezone: ${tz} (UTC${utcOffset})

### Success Output Schema
{
  "normalized": {
    "date": "<YYYY-MM-DD>",
    "time": "<HH:MM>",
    "tz": "${tz}"
  },
  "normalization_confidence": <float between 0 and 1>
}

### Guardrail Schema
{
  "status": "needs_clarification",
  "message": "Ambiguous date/time or department"
}

### Rules
1. Only output valid JSON that exactly matches one of the schemas above.
2. Do not include any other text, commentary, or formatting.
3. If the input is incomplete or ambiguous, always return the Guardrail JSON.
4. Use the given today's date (${todayStr}) only as the reference for relative phrases (e.g., "tomorrow").
`;

    const response = await client.chat.complete({
      model: "mistral-small",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
    });

    const rawText = response.choices[0].message.content;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in model output");

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Normalization failed:", err);
    return { status: "error", message: err.message };
  }
}

/**
 * Combine extracted and normalized JSON into final appointment JSON
 * @param {Object} entitiesJson
 * @param {Object} normalizedJson
 * @returns {Object} Final combined JSON
 */
export function combineAppointmentJson(entitiesJson, normalizedJson) {
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return {
    appointment: {
      department: capitalize(entitiesJson.entities.department),
      date: normalizedJson.normalized.date,
      time: normalizedJson.normalized.time,
      tz: normalizedJson.normalized.tz,
    },
    status: "ok",
  };
}
