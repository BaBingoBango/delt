//
//  awakenAgent.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {genkit} from "genkit";
import {gemini25ProPreview0325, googleAI} from "@genkit-ai/googleai";

// Start by initializing a generic Genkit object
console.log("%c[System] [awakenAgent.js] Initializing AI model...", "background-color: #CBC3E3;");
const ai = genkit({
    plugins: [googleAI()],
    model: gemini25ProPreview0325,
});

export default async function handler(req, res) {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }
    console.log("%c[System] [awakenAgent.js] POST method confirmed.", "background-color: #CBC3E3;");

    try {
        // Ensure required parameters are provided
        const {systemPrompt, chatPrompt, chatHistory} = req.body;
        if (!systemPrompt || !chatPrompt || !chatHistory) {
            return res.status(400).json({ error: "Error: Requires parameters systemPrompt, chatHistory, and prompt" });
        }
        console.log("%c[System] [awakenAgent.js] Required parameters are present.", "background-color: #CBC3E3;");

        // Generate!
        console.log("%c[System] [awakenAgent.js] Generating...", "background-color: #CBC3E3;");
        const APIresponse = await ai.generate({
            system: systemPrompt,
            prompt: chatPrompt,
            messages: chatHistory,
        });
        const agentResponse = APIresponse.text;

        // Return!
        res.status(200).json({response: agentResponse});
        console.log("%c[System] [awakenAgent.js] API responded with no errors. Response:", "background-color: #CBC3E3;");
        console.log(agentResponse);

    // Handle errors by printing and with a code 500
    } catch(exception) {
        console.error("[System] [awakenAgent.js] ", exception);
        res.status(500).json({ error: `An error occurred while communicating with the AI model. ${exception}` });
    }
};
