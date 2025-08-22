//
//  awakenAgent.js
//  doubleact
//
//  Copyright © 2025 Chorale LLC
//

import {GenerationCommonConfigSchema, genkit, z} from "genkit";
import {googleAI} from "@genkit-ai/googleai";
import openAI from "genkitx-openai";
import anthropic, {claude4Opus} from "genkitx-anthropic";

// Gemini 2.5 Pro
const gemini = genkit({
    plugins: [googleAI()], // Key: process.env.GOOGLE_GENAI_API_KEY
    model: googleAI.model('gemini-2.5-pro'),
});

// ChatGPT 5 Thinking
const gpt5ConfigSchema = GenerationCommonConfigSchema.extend({
    reasoning_effort: z.enum(["minimal", "low", "medium", "high"]).optional(),
    verbosity: z.enum(["low", "medium", "high"]).optional(),
});
const chatgpt = genkit({
    plugins: [
        openAI({
            apiKey: process.env.OPENAI_API_KEY,
            models: [
                {
                    name: "gpt-5",
                    info: {
                        label: "OpenAI — GPT-5",
                        versions: ["gpt-5"],
                        supports: {
                            multiturn: true,
                            tools: true,
                            media: true,
                            systemRole: true,
                            output: ["json", "text"],
                        },
                    },
                    configSchema: gpt5ConfigSchema,
                },
            ],
        }),
    ],
    model: "openai/gpt-5",
});

// Claude Opus 4
const claude = genkit({
    plugins: [anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })],
    model: claude4Opus,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        console.error("[System] [awakenAgent.js] Error: Method Not Allowed. Received " + req.method);
        return res.status(405).end('Method Not Allowed');
    }
    console.log("%c[System] [awakenAgent.js] POST method confirmed.", "background-color: #CBC3E3;");

    // Ensure required parameters are provided
    const {systemPrompt, chatHistory, newUserPrompt, team} = req.body;
    if (!systemPrompt || !chatHistory || !newUserPrompt || !team) {
        const errorMessage = "Error: Requires parameters systemPrompt, chatHistory, newUserPrompt, and team.";
        console.error("[System] [awakenAgent.js] " + errorMessage);
        return res.status(400).json({
            error: errorMessage
        });
    }
    console.log("%c[System] [awakenAgent.js] Required parameters are present.", "background-color: #CBC3E3;");

    // Print the received parameters for debugging
    console.log("%c[System] [awakenAgent.js] Received parameters:", "background-color: #CBC3E3;");
    // console.log("System Prompt:", systemPrompt);
    console.log("Chat History:", chatHistory);
    console.log("New User Prompt:", newUserPrompt);
    console.log("Team:", team);

    const maxRetries = 2; // Initial attempt + 1 retry
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Generate the response!
            console.log(`%c[System] [awakenAgent.js] Generating... (Attempt ${attempt}/${maxRetries})`, "background-color: #CBC3E3;");
            let agentResponse = "";

            // Switch based off of team
            if (team.name === "Diamonds") {
                const genkitResponse = await gemini.generate({
                    system: systemPrompt,
                    prompt: newUserPrompt,
                    messages: chatHistory,
                });
                agentResponse = genkitResponse.text;
            } else if (team.name === "Hearts") {
                const genkitResponse = await chatgpt.generate({
                    system: systemPrompt,
                    prompt: newUserPrompt,
                    messages: chatHistory,
                });
                agentResponse = genkitResponse.text;
            } else {
                // Spades
                const genkitResponse = await claude.generate({
                    system: systemPrompt,
                    prompt: newUserPrompt,
                    messages: chatHistory,
                });
                agentResponse = genkitResponse.text;
            }

            // Return!
            res.status(200).json({response: agentResponse});
            console.log("%c[System] [awakenAgent.js] API responded with no errors. Response:", "background-color: #CBC3E3;");
            console.log(agentResponse);
            return; // Exit loop on success

        } catch(exception) {
            console.error(`[System] [awakenAgent.js] Attempt ${attempt} failed:`, exception);
            if (attempt < maxRetries) {
                console.log("[System] [awakenAgent.js] Retrying in 30 seconds...");
                await sleep(30000);
            } else {
                // Handle final error by printing and with a code 500
                console.error("[System] [awakenAgent.js] All retry attempts failed.", exception);
                res.status(500).json({ error: `An error occurred while communicating with the AI model. ${exception}` });
            }
        }
    }
};
