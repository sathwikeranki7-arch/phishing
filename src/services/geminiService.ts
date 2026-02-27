import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  isPhishing: boolean;
  riskScore: number; // 0 to 100
  threatLevel: "Low" | "Medium" | "High" | "Critical";
  reasons: string[];
  recommendations: string[];
  domainInfo: {
    domain: string;
    isLikelySpoofed: boolean;
    spoofedTarget?: string;
  };
}

export async function analyzeURL(url: string): Promise<AnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following URL for phishing characteristics: ${url}. 
      Consider patterns like typosquatting, suspicious top-level domains, excessive subdomains, obfuscation, and common phishing keywords.
      Return a detailed risk assessment.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPhishing: { type: Type.BOOLEAN },
            riskScore: { type: Type.NUMBER, description: "Risk score from 0 (Safe) to 100 (Critical Phishing)" },
            threatLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            reasons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of specific red flags or reasons for the assessment"
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Actionable advice for the user"
            },
            domainInfo: {
              type: Type.OBJECT,
              properties: {
                domain: { type: Type.STRING },
                isLikelySpoofed: { type: Type.BOOLEAN },
                spoofedTarget: { type: Type.STRING, description: "The legitimate brand being impersonated, if any" }
              },
              required: ["domain", "isLikelySpoofed"]
            }
          },
          required: ["isPhishing", "riskScore", "threatLevel", "reasons", "recommendations", "domainInfo"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing URL:", error);
    throw new Error("Failed to analyze URL. Please try again.");
  }
}
