import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Cognitive Behavioral and Community Security Trend Analysis Endpoint
app.post("/api/behavioral-analysis", async (req, res) => {
  try {
    const { description, submittedBy } = req.body;
    if (!description || !submittedBy) {
      return res.status(400).json({ error: "Missing required fields: description or submittedBy" });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze the following community log submitted by: ${submittedBy}\nLog content: ${description}`,
      config: {
        systemInstruction: `You are an expert Community Security Analyst and Cognitive Behavioral Trend Evaluator for a premium Homeowners Association (HOA).
Your role is to evaluate reported incidents, suspicious activities, or resident behavior disputes, and provide a deep, professional analysis.

Analyze:
1. Threat Level: Is it Low, Medium, or High?
2. Summary: A concise, human-friendly 1-2 sentence summary of the incident/trend.
3. Behavioral Analysis: Evaluate the underlying cognitive/behavioral triggers or patterns of the people involved (e.g. environmental stress, neighbor friction, frustration with HOA policy, general safety concerns).
4. Security Recommendations: Concrete, professional, physical or logistical security recommendations (e.g. lighting upgrades, neighborhood watch walks, CCTV placement, smart locks, board mediator deployment).
5. Social Fabric Impact: How this behavior or situation affects neighbor trust, and clear steps on how the board can foster a positive, high-satisfaction community culture.

You must return your response STRICTLY as a JSON object matching this schema:
{
  "threatLevel": "low" | "medium" | "high",
  "summary": "concise summary",
  "behavioralAnalysis": "behavioral evaluation text",
  "securityRecommendations": "security advice",
  "socialFabricImpact": "impact on neighborhood relations and satisfaction"
}
Do not return any markdown formatting outside of the JSON object. Return clean, parsed JSON.`,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    const analysisResult = JSON.parse(responseText.trim());
    res.json(analysisResult);
  } catch (err: any) {
    console.error("Error in /api/behavioral-analysis:", err);
    res.status(500).json({
      error: "Failed to perform cognitive behavioral trend analysis",
      details: err.message,
    });
  }
});

// 2. 24/7 Support Chatbot Endpoint
app.post("/api/chatbot", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid or missing messages array in request body" });
    }

    const ai = getGeminiClient();

    // Map message roles from user input ('user' or 'assistant'/'bot' to 'user' or 'model')
    const contents = messages.map((m: any) => {
      const role = m.role === "user" ? "user" : "model";
      return {
        role,
        parts: [{ text: m.content || m.text }],
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: `You are "HOA Concierge", a warm, highly professional 24/7 automated support chatbot for our HOA Community.
Your job is to assist residents with any queries regarding HOA dues, violation resolution, architectural reviews, parking policies, pets, bylaws, and community operations.

To keep your answers accurate and grounded, refer to these official HOA bylaws and guidelines:
- Dues: Quarterly assessment is $250, billed on the 1st of January, April, July, and October. It is overdue after 15 calendar days, incurring a $25 late fee. Payments can be scheduled or made directly through the HOA Tracker dashboard.
- Violations: The board issues a formal warning first. If not corrected within 10 days, a fine of $50 is assessed. Repeat offenses of the same rule within 6 months increase the fine to $100. Residents can submit dispute letters via the violation dashboard.
- Pets: All household pets (dogs, cats) must be on a leash under 6 feet when in common areas. Pet owners must clean up immediately after their pets. Fines for pet violations start at $50.
- Noise & Quiet Hours: Quiet hours are from 10:00 PM to 7:00 AM daily. Respect neighbors and keep outdoor noise/parties minimal.
- Trash & Recycling: Collected on Tuesday mornings. Bins may be placed on the curb after 6:00 PM on Monday and must be stored out of sight by Tuesday 8:00 PM.
- Architectural Control Committee (ACC): Any changes to the exterior of the house (painting, roofs, fences, landscaping changes, decks) require an ACC Form submitted and approved BEFORE starting work. Applications take up to 14 days for review.
- Board Meetings: Held on the second Wednesday of every month at 7:00 PM in the community clubhouse and streamed online. Residents are always welcome to join and share their feedback.

Response Guidelines:
- Be incredibly polite, welcoming, reassuring, and professional.
- Refer to specific rules when appropriate to reassure the resident.
- Maintain a proactive, builder-oriented tone that simplifies community tasks and boosts resident satisfaction.
- Keep your responses clear, structured (using bullet points if listing steps), and concise (under 250 words) so they are easy to read in a mobile-style chat window.`,
      },
    });

    const reply = response.text;
    res.json({ reply: reply || "I'm here to help, but I couldn't formulate a response right now. Please try again." });
  } catch (err: any) {
    console.error("Error in /api/chatbot:", err);
    res.status(500).json({
      error: "Failed to process chat response",
      details: err.message,
    });
  }
});

// 3. Automated HOA Financial Insights Endpoint
app.post("/api/financial-insights", async (req, res) => {
  try {
    const { duesSummary, expenses, budgets } = req.body;
    if (!duesSummary || !expenses || !budgets) {
      return res.status(400).json({ error: "Missing required fields: duesSummary, expenses, or budgets" });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform an HOA financial health analysis based on this data:\n
Dues Collected / Outstanding: ${JSON.stringify(duesSummary)}\n
Expenses Log: ${JSON.stringify(expenses)}\n
Budget Allocation limits: ${JSON.stringify(budgets)}`,
      config: {
        systemInstruction: `You are a Senior HOA CPA and Financial Advisor for high-end residential communities.
Evaluate the assessment collections, actual spending vs budget allocations, outstanding balances, and provide deep strategic insights.

Assess:
1. Financial Health Score: A rating from 0 to 100.
2. Summary: A detailed summary of the current financial state.
3. Budget Variance Observations: Critical comparisons of budgeted vs actual expenditures. Identify over-spending, under-spending, or potential reserve fund depletion.
4. Strategic Board Recommendations: 3 to 4 actionable, professional recommendations for board members to optimize cash flows, improve dues collection rates, or trim unnecessary operations costs.

You must return your response STRICTLY as a JSON object matching this schema:
{
  "financialHealthScore": number,
  "summary": "summary text",
  "budgetVarianceObservations": "budget variance text",
  "boardRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
Do not return any markdown formatting outside of the JSON object. Return clean, parsed JSON.`,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    const analysisResult = JSON.parse(responseText.trim());
    res.json(analysisResult);
  } catch (err: any) {
    console.error("Error in /api/financial-insights:", err);
    res.status(500).json({
      error: "Failed to perform financial trend analysis",
      details: err.message,
    });
  }
});

// 4. Automated Communication & Sentiment Trend Analysis Endpoint
app.post("/api/analyze-communications", async (req, res) => {
  try {
    const { communications } = req.body;
    if (!communications || !Array.isArray(communications)) {
      return res.status(400).json({ error: "Missing or invalid communications array" });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform a cognitive behavioral evaluation on these public HOA communications:\n${JSON.stringify(communications)}`,
      config: {
        systemInstruction: `You are an expert Community Psychologist and Cognitive Behavioral Threat Analyst.
Your goal is to inspect the attached public communication logs (forum posts, announcements, comments) to detect underlying social triggers, neighbor friction points, security risks (like vandalism, physical confrontations, or unmaintained dangerous spaces), and sentiment trends.

Evaluate:
1. Overall Sentiment: Must be "Neutral", "Cooperative", "Tense", or "Hostile".
2. Identified Triggers: Summarize what is causing friction (e.g. parking, pets, repairs, lack of board transparency).
3. Security Risk Assessment: Evaluate potential physical, property, or liability safety concerns.
4. Board Remediation Plan: 3 actionable items the board can implement immediately (like updating signs, sending friendly reminders, holding a public meeting, or altering policy).
5. Executive Summary: A formal, clean summarized report for the HOA board.

You must return your response STRICTLY as a JSON object matching this schema:
{
  "overallSentiment": "Neutral" | "Cooperative" | "Tense" | "Hostile",
  "identifiedTriggers": "triggers explanation",
  "securityRiskAssessment": "security risks evaluation",
  "boardRemediationPlan": ["plan 1", "plan 2", "plan 3"],
  "executiveSummary": "executive summary text"
}
Do not return any markdown formatting outside of the JSON object. Return clean, parsed JSON.`,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    const analysisResult = JSON.parse(responseText.trim());
    res.json(analysisResult);
  } catch (err: any) {
    console.error("Error in /api/analyze-communications:", err);
    res.status(500).json({
      error: "Failed to analyze communications logs",
      details: err.message,
    });
  }
});

// Configure Vite or Static Assets serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HOA Tracker full-stack server running on http://localhost:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Failed to start server:", err);
});
