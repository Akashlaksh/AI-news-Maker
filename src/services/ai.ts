import { GoogleGenAI, Type } from '@google/genai';

export async function generateNewsContent(imageBase64Full: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  
  // Extract mime type and base64 data
  const match = imageBase64Full.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mimeType = match[1];
  const base64Data = match[2];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        }
      },
      "You are an expert news editor. Analyze this image and write a compelling news headline (max 10 words), a subheadline (max 20 words), and a category tag (e.g., POLITICS, WORLD, TECH, BREAKING). Return as JSON."
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          subheadline: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["headline", "subheadline", "category"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { headline: "Error generating headline", subheadline: "", category: "ERROR" };
  }
}

export async function generateSocialCaption(headline: string, subheadline: string, category: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write an engaging Facebook post caption for this news story.\nCategory: ${category}\nHeadline: ${headline}\nSubheadline: ${subheadline}\nInclude 2-3 relevant emojis and 3-4 hashtags. Keep it professional but engaging. Do not wrap the response in quotes.`,
  });
  return response.text;
}
