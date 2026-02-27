# PhishGuard AI

> Real-time AI-powered phishing detection for URLs and emails — built with React, Vite, and the Gemini API.

---

## What is PhishGuard AI?

PhishGuard AI is a cybersecurity tool that uses Google's Gemini language model to analyze URLs and email content for phishing indicators in real time. It goes beyond basic blocklist lookups and detects:

- **Typosquatting & homoglyph attacks** — e.g. `paypa1.com`, `g00gle.com`
- **Brand impersonation** — fake login pages mimicking banks, payment platforms, government portals
- **URL obfuscation** — hex encoding, IP-based URLs, excessive subdomains
- **Zero-day phishing patterns** — novel structural anomalies not yet in known blocklists
- **Social engineering tricks** — urgency manipulation, fake OTP requests, account suspension threats
- **Embedded suspicious links** — URLs extracted and assessed from email body content

### Features

| Feature | Details |
|---|---|
| 🔗 URL Scanner | Paste any URL and get an AI risk score (0–100), threat level, domain analysis, and recommendations |
| 📧 Email Analyzer | Paste email subject + body to detect phishing tactics, impersonated brands, and embedded links |
| ⚡ Real-time | Results stream back from Gemini within seconds |
| 🎯 Structured output | JSON schema-validated responses ensure consistent, parseable results |

---

## Tech Stack

- **Frontend** — React 19 + TypeScript + Vite
- **Styling** — Vanilla CSS (minimal dark theme)
- **Animations** — Framer Motion
- **AI** — Google Gemini 2.5 Flash (`@google/genai`)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd phishing
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your API key

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in your key:

```
GEMINI_API_KEY=your_api_key_here
```

> ⚠️ Never commit your `.env.local` file. It is already listed in `.gitignore`.

### 4. Run the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173** (or the port Vite assigns).

---

## Usage

1. Open the app in your browser
2. Choose a mode using the tab bar at the bottom:
   - **URL Scanner** — paste any suspicious link and click the arrow button
   - **Email Analyzer** — paste the email subject and body, then click the arrow button
3. PhishGuard AI will return:
   - A **verdict** (Phishing / Likely Safe)
   - A **risk or urgency score** with an animated progress bar
   - **Risk indicators** — specific red flags found
   - **Recommendations** — actionable steps to stay safe
   - Additional info like impersonated brand, detected tricks, and suspicious embedded links

---

## Project Structure

```
phishing/
├── src/
│   ├── App.tsx              # Main UI component
│   ├── index.css            # Global styles (dark theme)
│   ├── main.tsx             # React entry point
│   └── services/
│       └── geminiService.ts # Gemini API calls + TypeScript types
├── .env.example             # Environment variable template
├── index.html
├── vite.config.ts
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |

---

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready to deploy to any static hosting (Vercel, Netlify, GitHub Pages, etc.).

---

## License

Apache 2.0 — see [LICENSE](LICENSE) for details.
