import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Get Personalized Tips based on logged user carbon activity
  app.post("/api/gemini/tips", async (req, res) => {
    try {
      const { logs, activeChallenges } = req.body;

      if (!logs || !Array.isArray(logs) || logs.length === 0) {
        return res.status(400).json({
          error: "Invalid input. Please submit historical carbon activity logs."
        });
      }

      // Check if Gemini API key exists
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.warn("GEMINI_API_KEY is not defined. Falling back to rule-based tips.");
        return res.json({
          isFallback: true,
          tips: [
            {
              category: "general",
              title: "Smart Travel Adjustment",
              description: "Based on your logs, driving represents a primary source. Consider grouping chores or carpooling."
            },
            {
              category: "energy",
              title: "Unplug Chargers and Electronics",
              description: "Laptops and phones plugged in overnight continue drawing standby current, adding 150kg to your yearly emissions."
            },
            {
              category: "food",
              title: "Adopt Veggie Alternates",
              description: "Decreasing meat intake even on weekdays offers the single largest individual lever to hit the 5kg sustainable limit."
            }
          ]
        });
      }

      // Format user's data details for Gemini context
      const logsSummary = logs.slice(-7).map((log: any) => {
        return `Date: ${log.date}, Transport: ${log.calculatedEmissions.transport}kg CO2 (Car: ${log.transport.carDistance}km ${log.transport.carType}), Energy: ${log.calculatedEmissions.energy}kg CO2 (${log.energy.electricityKwh}kWh), Food: ${log.calculatedEmissions.food}kg CO2 (${log.food.dietType} diet), Shopping: ${log.calculatedEmissions.shopping}kg CO2. Total emissions: ${log.calculatedEmissions.total}kg CO2.`;
      }).join("\n");

      const challengesSummary = activeChallenges && activeChallenges.length > 0 
        ? activeChallenges.map((c: any) => `- ${c.title}: ${c.description} (${c.co2Savings}kg CO2 saved)`).join("\n")
        : "None selected yet.";

      const promptInquiry = `
You are an expert, highly encouraging climate scientist and personalized "Eco-Coach". 
Your goal is to analyze the user's weekly carbon activity logs and provide high-fidelity, customized guidance.

Here are the user's activities over the last week:
${logsSummary}

Here are the active challenges/goals they joined:
${challengesSummary}

Please construct a JSON response with the following strictly enforced schema:
{
  "coachStatement": "A friendly, conversational, short paragraph validating their efforts, pointing out where they did best (e.g., great transport savings) and where the biggest carbon leakage is. Be encouraging, objective, and specific. Limit to 3 sentences maximum.",
  "weeklyGrade": "A letter grade (A+, A, B, C, D, or F) representing how close they are to the sustainable 1.5°C goal of 5kg CO2 daily average.",
  "topImpactCategory": "The category ('transport', 'energy', 'food', or 'shopping') causing the highest emissions.",
  "smartTips": [
    {
      "category": "transport, energy, food, or shopping",
      "title": "A highly specific, custom-tailored recommendation title based on their data",
      "description": "Specific daily habits or changes they can make. Explain exactly how this fits their logged emissions (e.g. 'Since you drove 40km in a petrol car...').",
      "potentialSavingKg": 4.5
    },
    {
      "category": "transport, energy, food, or shopping",
      "title": "Second tailored recommendation",
      "description": "Specific habit details...",
      "potentialSavingKg": 2.3
    },
    {
      "category": "transport, energy, food, or shopping",
      "title": "Third tailored recommendation",
      "description": "Specific habit details...",
      "potentialSavingKg": 1.2
    }
  ]
}

Return ONLY the raw JSON block without markdown wrappers, backticks, or any other output. Make sure it is valid JSON.
`;

      // Call Gemini SDK
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptInquiry,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const responseText = response.text ? response.text.trim() : "";
      
      // Safe parse JSON
      try {
        const parsed = JSON.parse(responseText);
        return res.json({
          isFallback: false,
          ...parsed
        });
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", responseText, parseError);
        // Fallback inside catch
        throw parseError;
      }

    } catch (error: any) {
      console.error("Gemini API server route error:", error);
      res.status(500).json({
        error: "Failed to generate tips with Gemini API.",
        message: error.message || String(error)
      });
    }
  });

  // API: Real-time custom chat with the Eco-Coach
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.json({
          reply: "I am currently running in template fallback mode. To enable real-time smart conversations, please configure your GEMINI_API_KEY inside the Secrets panel. For now, remember that simple changes like turning off heat in empty rooms or washing laundry with cold water save up to 100 kilograms of CO2 annually!"
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = 
        "You are the expert Sustaina Eco-Coach. You help users understand their carbon footprint " +
        "and suggest personalized, high-leverage habits to reduce it. Keep answers conversational, " +
        "factual, concise (maximum 4 sentences), and extremely encouraging. Avoid heavy blocks of metadata.";

      const chatHistory = history && Array.isArray(history) 
        ? history.map((h: any) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          }))
        : [];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          ...chatHistory,
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          temperature: 0.4,
          maxOutputTokens: 350
        }
      });

      return res.json({
        reply: response.text ? response.text.trim() : "I'm sorry, I couldn't process your request."
      });

    } catch (err: any) {
      console.error("Gemini Chat server error:", err);
      return res.status(500).json({
        error: "Failed to fetch response.",
        reply: "I encountered an issue connecting to the AI Coach grid. Please verify your internet connection and try asking again!"
      });
    }
  });

  // Vite integration
  const distPath = path.join(process.cwd(), "dist");
  const isProductionMode = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, "index.html"));

  if (!isProductionMode) {
    console.log("Starting Express server in DEVELOPMENT mode with Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Express server in PRODUCTION mode, serving compiled assets from /dist...");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express dev server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to launch Express server:", err);
});
