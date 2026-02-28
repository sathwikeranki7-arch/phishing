import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  isPhishing: boolean;
  riskScore: number;
  threatLevel: "Low" | "Medium" | "High" | "Critical";
  reasons: string[];
  recommendations: string[];
  domainInfo: {
    domain: string;
    isLikelySpoofed: boolean;
    spoofedTarget?: string;
    ageEstimate?: string;
    registrar?: string;
  };
  technicalDetails: {
    hasPunycode: boolean;
    isShortened: boolean;
    suspiciousTld: boolean;
    excessiveSubdomains: boolean;
    hiddenRedirects: boolean;
    usesIpAddress: boolean;
  };
  threatBreakdown: {
    category: string;
    finding: string;
    severity: "Low" | "Medium" | "High" | "Critical";
  }[];
  networkIntelligence?: {
    ipAddress: string;
    location: string;
    isp: string;
    reputation: string;
    asn?: string;
  };
}

async function resolveIP(hostname: string): Promise<string | null> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
    const data = await response.json();
    return data.Answer?.[0]?.data || null;
  } catch (e) {
    console.error("DNS Resolution failed", e);
    return null;
  }
}

async function getGeoLocation(ip: string) {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      location: `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`,
      isp: data.org || 'Unknown',
      asn: data.asn || 'Unknown'
    };
  } catch (e) {
    console.error("GeoLocation failed", e);
    return { location: 'Unknown', isp: 'Unknown', asn: 'Unknown' };
  }
}

export async function analyzeURL(url: string): Promise<AnalysisResult> {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Start network intelligence gathering in parallel
    const ipPromise = resolveIP(hostname);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a deep security audit on this URL: ${url}. 
      Check for:
      1. Typosquatting/Spoofing (e.g., 'paypa1' instead of 'paypal').
      2. Punycode/Homograph attacks (using similar-looking characters from different alphabets).
      3. Suspicious TLDs (.xyz, .top, .work, etc. often used for phishing).
      4. URL Shorteners (bit.ly, t.co, etc. used to hide the final destination).
      5. Excessive subdomains or long paths designed to hide the real domain on mobile devices.
      6. Use of IP addresses instead of domain names.
      7. Keywords associated with phishing (login, secure, verify, update-account).
      8. Domain age and registrar reputation (simulate/infer based on known patterns).
      
      Return a comprehensive JSON assessment including a 'threatBreakdown' array that explains exactly why the specific threat level was assigned for different categories (e.g., 'Domain Identity', 'URL Structure', 'IP Reputation', 'Content Patterns').
      Also include a 'networkReputation' string field (e.g., "Clean", "Suspicious", "Malicious") based on your knowledge of this domain/IP.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPhishing: { type: Type.BOOLEAN },
            riskScore: { type: Type.NUMBER },
            threatLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            domainInfo: {
              type: Type.OBJECT,
              properties: {
                domain: { type: Type.STRING },
                isLikelySpoofed: { type: Type.BOOLEAN },
                spoofedTarget: { type: Type.STRING },
                ageEstimate: { type: Type.STRING },
                registrar: { type: Type.STRING }
              },
              required: ["domain", "isLikelySpoofed"]
            },
            technicalDetails: {
              type: Type.OBJECT,
              properties: {
                hasPunycode: { type: Type.BOOLEAN },
                isShortened: { type: Type.BOOLEAN },
                suspiciousTld: { type: Type.BOOLEAN },
                excessiveSubdomains: { type: Type.BOOLEAN },
                hiddenRedirects: { type: Type.BOOLEAN },
                usesIpAddress: { type: Type.BOOLEAN }
              },
              required: ["hasPunycode", "isShortened", "suspiciousTld", "excessiveSubdomains", "hiddenRedirects", "usesIpAddress"]
            },
            threatBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  finding: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] }
                },
                required: ["category", "finding", "severity"]
              }
            },
            networkReputation: { type: Type.STRING }
          },
          required: ["isPhishing", "riskScore", "threatLevel", "reasons", "recommendations", "domainInfo", "technicalDetails", "threatBreakdown", "networkReputation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Finalize network intelligence
    const ip = await ipPromise;
    if (ip) {
      const geo = await getGeoLocation(ip);
      result.networkIntelligence = {
        ipAddress: ip,
        location: geo.location,
        isp: geo.isp,
        asn: geo.asn,
        reputation: result.networkReputation
      };
    }

    return result as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing URL:", error);
    throw new Error("Failed to analyze URL. Please try again.");
  }
}
