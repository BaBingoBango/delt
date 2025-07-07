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
        console.log(`%c[System] [Awakening.js] About to awaken agent ${agent.id}. Debug readout:`, "background-color: #CBC3E3;");
        directory.debugAgent(agent.id);
        console.log(`%c[System] [Awakening.js] Sending prompt:`, "background-color: #CBC3E3;", newUserPrompt);

        // Update the agent's status
        agent.status = "Generating...";
        directory.triggerUpdate();

        // Call the API file to get a response!
        const res = await fetch("/api/awakenAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: fullSystemPrompt,
                newUserPrompt: newUserPrompt,
                chatHistory: agent.chatHistory,
                team: agent.team,
            })
        });
        if (!res.ok) {
            agent.status = "Idle";
            directory.triggerUpdate();
            throw new Error("Failed to send system message. (API request failed)");
        }

        // Print the response!
        const json = await res.json();
        const agentResponse = json.response;
        console.log(agentResponse, agent.id);
        agent.status = "Idle";
        directory.triggerUpdate();

        // Update the agent's chat history with the two new messages it has just experienced
        agent.chatHistory.push({
            role: "user",
            content: [{ text: newUserPrompt }],
        });
        agent.chatHistory.push({
            role: "model",
            content: [{ text: agentResponse }],
        });

        // Return the response
        return agentResponse;
    }
}

// Class Export
export {Awakening};
