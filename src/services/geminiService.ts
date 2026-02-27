import { GoogleGenAI, Type } from "@google/genai";

// Lazy init — avoids a crash at module-load time when the key is absent
function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY as string | undefined;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Create a .env.local file with GEMINI_API_KEY=your_key."
    );
  }
  return new GoogleGenAI({ apiKey: key });
}

// ─── URL Analysis ─────────────────────────────────────────────────────────────

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
  // Optional list of extracted suspicious links from the URL analysis
  suspiciousLinks?: string[];
}

export async function analyzeURL(url: string): Promise<AnalysisResult> {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: `Analyze the following URL for phishing characteristics: ${url}.

      Consider ALL of the following signals:
      - Typosquatting and homoglyph attacks (e.g. paypa1.com, g00gle.com)
      - Suspicious or unusual top-level domains (e.g. .xyz, .tk, .ml)
      - Excessive subdomains or deeply nested paths used to hide the real domain
      - URL obfuscation techniques (hex encoding, IP addresses instead of domain names, excessive redirects)
      - Common phishing keywords in the path (e.g. login, secure, verify, update, account, banking, otp)
      - Brand impersonation of major organizations (banks, government portals, social media, payment platforms)
      - Newly crafted or zero-day patterns that don't match known-good domains — even if the domain is not in a known blacklist, flag structural anomalies
      - Presence of sensitive data collection signals in query parameters (password=, token=, otp=)

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

// ─── Email Analysis ───────────────────────────────────────────────────────────

export interface EmailAnalysisResult {
  isPhishing: boolean;
  urgencyScore: number; // 0 to 100
  threatLevel: "Low" | "Medium" | "High" | "Critical";
  impersonatedBrand: string | null;
  detectedTricks: string[];    // e.g. "Fake OTP request", "Account suspension threat"
  suspiciousLinks: string[];   // URLs extracted from the email body
  reasons: string[];
  recommendations: string[];
}

export async function analyzeEmail(subject: string, body: string): Promise<EmailAnalysisResult> {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: `You are a cybersecurity expert specializing in phishing email detection. Analyze the following email for phishing and social engineering characteristics.

EMAIL SUBJECT: ${subject || "(no subject)"}

EMAIL BODY:
${body}

Carefully look for ALL of the following:
1. IMPERSONATION: Does it claim to be from a bank, government portal, social media platform, payment service, or known brand? Which one?
2. URGENCY & FEAR: Does it use threats like account suspension, legal action, missed parcel, prize winning, or time limits?
3. CREDENTIAL HARVESTING: Does it ask for passwords, OTPs, PINs, card numbers, Aadhaar, PAN, or other sensitive data?
4. SUSPICIOUS LINKS: Extract ALL URLs or hyperlinks present in the email body.
5. SOCIAL ENGINEERING TRICKS: Identify specific techniques used (e.g., "Fake OTP request", "Account suspension threat", "Lottery/prize scam", "False invoice", "Package delivery scam", "IT helpdesk impersonation", "KYC update demand", "Fake security alert").
6. LANGUAGE PATTERNS: Poor grammar, generic greetings ("Dear Customer"), excessive capitalization, or emotional manipulation.
7. NOVELTY: Even if the brand is not widely known, flag structural manipulation patterns typical of newly crafted phishing campaigns.

Return a comprehensive phishing assessment.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPhishing: { type: Type.BOOLEAN, description: "True if the email shows phishing or social engineering characteristics" },
            urgencyScore: { type: Type.NUMBER, description: "Urgency/manipulation score from 0 (calm/normal) to 100 (extreme urgency/fear)" },
            threatLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            impersonatedBrand: { type: Type.STRING, description: "Name of the legitimate brand being impersonated, or null if none" },
            detectedTricks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific social engineering techniques detected, e.g. 'Fake OTP request', 'Account suspension threat', 'Credential harvesting'"
            },
            suspiciousLinks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "All URLs or hyperlinks found in the email body"
            },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Detailed reasons and red flags supporting the phishing verdict"
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable steps the recipient should take"
            }
          },
          required: ["isPhishing", "urgencyScore", "threatLevel", "impersonatedBrand", "detectedTricks", "suspiciousLinks", "reasons", "recommendations"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as EmailAnalysisResult;
  } catch (error) {
    console.error("Error analyzing email:", error);
    throw new Error("Failed to analyze email. Please try again.");
  }
}
