import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BusinessIdea {
  title: string;
  description: string;
  monetization: string;
  tags: string[];
}

export async function generateBusinessIdeas(
  selectedTools: string[],
  goals?: string
): Promise<BusinessIdea[]> {
  try {
    const toolsText = selectedTools.join(", ");
    const goalsText = goals ? `User goals: ${goals}\n\n` : "";
    
    const prompt = `You are a business strategy expert specializing in tech stack analysis and monetization opportunities.

${goalsText}Selected tech tools: ${toolsText}

Generate 3 creative and realistic business ideas that specifically leverage these tools. For each idea, provide:
1. A compelling title (max 50 characters)
2. A detailed description explaining how the tools work together (100-200 words)
3. A specific monetization strategy (50-100 words)
4. 3-5 relevant tags/keywords

Focus on practical, implementable ideas that showcase the unique capabilities of the selected tools. Consider current market trends and opportunities.

Respond with JSON in this exact format:
{
  "ideas": [
    {
      "title": "Business Idea Title",
      "description": "Detailed description of the business idea and how the tools are used...",
      "monetization": "Specific monetization strategy...",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  monetization: { type: "string" },
                  tags: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["title", "description", "monetization", "tags"]
              }
            }
          },
          required: ["ideas"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data.ideas || [];
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Failed to generate business ideas:", error);
    throw new Error(`Failed to generate business ideas: ${error}`);
  }
}
