//
//  awakenAgent.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/googleai";
import openAI, {o3} from "genkitx-openai";

// Gemini 2.5 Pro
const gemini = genkit({
    plugins: [googleAI()],
    model: googleAI.model('gemini-2.5-pro'),
});

// ChatGPT o3
const chatgpt = genkit({
    plugins: [openAI({ apiKey: process.env.OPENAI_API_KEY })],
    model: o3,
});
console.log("%c[System] [awakenAgent.js] AI models initialized!", "background-color: #CBC3E3;");

export default async function handler(req, res) {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }
    console.log("%c[System] [awakenAgent.js] POST method confirmed.", "background-color: #CBC3E3;");

    try {
        // Ensure required parameters are provided
        const {systemPrompt, chatHistory, newUserPrompt, team} = req.body;
        if (!systemPrompt || !chatHistory || !newUserPrompt || !team) {
            return res.status(400).json({
                error: "Error: Requires parameters systemPrompt, chatHistory, newUserPrompt, and team."
            });
        }
        console.log("%c[System] [awakenAgent.js] Required parameters are present.", "background-color: #CBC3E3;");

        // Print the received parameters for debugging
        console.log("%c[System] [awakenAgent.js] Received parameters:", "background-color: #CBC3E3;");
        // console.log("System Prompt:", systemPrompt);
        console.log("Chat History:", chatHistory);
        console.log("New User Prompt:", newUserPrompt);
        console.log("Team:", team);

        // Generate the response!
        console.log("%c[System] [awakenAgent.js] Generating...", "background-color: #CBC3E3;");
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
            const genkitResponse = await gemini.generate({
                system: systemPrompt,
                prompt: newUserPrompt,
                messages: chatHistory,
            });
            agentResponse = genkitResponse.text;
        } else if (team.name === "Spades") {
            const genkitResponse = await chatgpt.generate({
                system: systemPrompt,
                prompt: newUserPrompt,
                messages: chatHistory,
            });
            agentResponse = genkitResponse.text;
        } else {
            // Clubs
            const genkitResponse = await chatgpt.generate({
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

    } catch(exception) {
        // Handle errors by printing and with a code 500
        console.error("[System] [awakenAgent.js] ", exception);
        res.status(500).json({ error: `An error occurred while communicating with the AI model. ${exception}` });
    }
};
