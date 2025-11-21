import { GoogleGenAI } from "@google/genai";
import { NormalizedBox } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePatternSwap = async (
  baseImageBase64: string,
  baseImageMimeType: string,
  patternImageBase64: string,
  patternImageMimeType: string,
  box: NormalizedBox
): Promise<string> => {
  try {
    // Construct a precise prompt using the normalized coordinates (0-1000 scale)
    const prompt = `
      Edit the first image provided. 
      I have defined a specific region on the first image with the following bounding box coordinates (on a 0-1000 scale):
      ymin: ${box.ymin}, xmin: ${box.xmin}, ymax: ${box.ymax}, xmax: ${box.xmax}.
      
      Task: Replace the visual content/pattern inside this specific bounding box region of the first image with the texture/pattern provided in the second image.
      
      Requirements:
      1. Strictly maintain the lighting, shadows, folds, and geometry of the object in the first image.
      2. Apply the pattern from the second image as if it were the actual fabric or surface texture of the object in the region.
      3. Blend the edges naturally so it looks like a realistic photo manipulation.
      4. Do not alter the background or areas outside the bounding box.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: baseImageMimeType,
              data: baseImageBase64
            }
          },
          {
            inlineData: {
              mimeType: patternImageMimeType,
              data: patternImageBase64
            }
          }
        ]
      },
      config: {
        // gemini-2.5-flash-image does not strictly support responseMimeType for images in all contexts via generateContent directly in the standard text output way, 
        // but it returns an image part in the candidate.
      }
    });

    // Extract the image from the response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
