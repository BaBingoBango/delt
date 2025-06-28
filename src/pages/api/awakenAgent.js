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
        const {systemPrompt, chatHistory} = req.body;
        if (!systemPrompt || !chatHistory) {
            return res.status(400).json({ error: "Error: Requires parameters systemPrompt and chatHistory" });
        }
        console.log("%c[System] [awakenAgent.js] Required parameters are present.", "background-color: #CBC3E3;");

        // Clean the chat history to only include role and content, and map 'assistant' to 'model'.
        const messages = chatHistory.map(message => ({
            role: message.role === 'assistant' ? 'model' : message.role,
            content: [{text: message.content}],
        }));

        // Generate!
        console.log("%c[System] [awakenAgent.js] Generating...", "background-color: #CBC3E3;");
        const APIresponse = await ai.generate({
            system: systemPrompt,
            messages: messages,
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
