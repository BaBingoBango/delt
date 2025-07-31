//
//  chat.js
//  doubleact
//
//  Copyright © 2025 Chorale LLC
//

import {gemini15Flash, gemini25ProPreview0325, googleAI} from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import {chiefSystemPrompt} from "../../../lib/systemPrompts";

// Initialize Genkit once, outside of the request handler.
// This is more efficient as it avoids re-initializing on every request.
const ai = genkit({
    plugins: [googleAI()],
    model: gemini15Flash,
});

/**
 * API handler for processing a user's prompt and returning an AI-generated response.
 */
export default async function handler(req, res) {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { prompt } = req.body;

        // Basic validation for the prompt
        if (!prompt) {
            return res.status(400).json({ error: 'A prompt is required in the request body.' });
        }

        // Directly call the AI generation function and 'await' the result.
        // This pauses the handler execution until the AI model responds.
        const { text } = await ai.generate({
            prompt: prompt,
            system: chiefSystemPrompt,
        });

        // Once the AI response is received, send it back to the client.
        // The 'text' constant is the string content from the AI response.
        res.status(200).json({ reply: text });

    } catch (error) {
        // It's good practice to handle potential errors during the API call.
        console.error('Error generating AI response:', error);
        res.status(500).json({ error: 'An error occurred while communicating with the AI model.' });
    }
}
