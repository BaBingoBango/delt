//
//  Awakening.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {Templates} from "@/DSP";

class Awakening {
    // Awaken an agent to respond by issuing it a new user-role prompt which will contain 1 or more system messages
    static async awakenAgent(directory, agent, newUserPrompt) {

        // Start by constructing the full system prompt
        const fullSystemPrompt = await Templates.getSystemPrompt(agent.rank, agent.team);

        // Call the API file to get a response
        directory.setAgentStatus(agent.id, "Generating...");
        const res = await fetch("/api/awakenAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: fullSystemPrompt,
                newUserPrompt: newUserPrompt,
                chatHistory: agent.chatHistory,
            })
        });
        if (!res.ok) {
            directory.setAgentStatus(agent.id, "Idle");
            throw new Error("Failed to send system message. (API request failed)");
        }

        // Print the response!
        const json = await res.json();
        const agentResponse = json.response;
        console.log(agentResponse, agent.id);
        directory.setAgentStatus(agent.id, "Idle");

        // Update the agent's chat history with the two new messages it has just experienced
        agent.chatHistory.push({
            role: "user",
            content: newUserPrompt,
        });
        agent.chatHistory.push({
            role: "model",
            content: agentResponse,
        });

        // Return the response
        return agentResponse;
    }
}

// Class Export
export {Awakening};
