//
//  MDS.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {Operations} from "@/SCD";

class Directory {
    constructor() {
        this.agents = new Map();
    }

    generateAgentID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        // Fall back to a short random string
        return Math.random().toString(36).substr(2, 9);
    }

    // Creates a new agent and adds it to the directory. (no security)
    recruitNewAgent(callSign, title, rank, superiorID, subordinateIDs) {
        // Generate a unique ID for the agent
        const identifier = this.generateAgentID();

        // Check for a duplicate ID
        if (this.agents.has(identifier)) {
            throw new Error(`Agent with ID ${identifier} already exists.`);
        }

        // Decide a suit of cards at random to assign this agent
        const suitsOfCards = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const team = suitsOfCards[Math.floor(Math.random() * suitsOfCards.length)];

        // Create an agent object
        const agent = {
            identifier,
            chatHistory: [],
            callSign,
            title,
            rank,
            team,
            superiorID,
            subordinateIDs: subordinateIDs || []
        };

        // Add this agent to its superior's list of subordinates
        if (superiorID && this.agents.has(superiorID)) {
            const superiorAgent = this.agents.get(superiorID);
            superiorAgent.subordinateIDs.push(identifier);
        }

        // Finally, add the agent to the directory (map)
        this.agents.set(identifier, agent);
        return identifier;
    }
}

class Scanning {
    static scanAgentResponse(responseText, agentID) {
        console.log(`%c[System] [MDS] Scanning agent response from ID ${agentID}...`, "background-color: #CBC3E3;");

        const callRegex = /###(.+?)###\s*([\s\S]*?)\s*###\1###/g;
        const matches = [...responseText.matchAll(callRegex)];

        if (matches.length === 0) {
            console.log("%c[System] [MDS] Scan complete. No system calls were found.", "color: gray;");
            return [];
        }

        let hasMalformedCall = false;
        const parsedCalls = [];

        for (const match of matches) {
            const uniqueID = match[1].trim();
            const callContent = match[2].trim();
            console.log(`%c[System] [MDS] Found potential system call with ID: ${uniqueID}`, "color: blue;");

            try {
                // Parse Type
                const typeMatch = callContent.match(/Type:\s*(\w+)/);
                if (!typeMatch) {
                    console.error(`%c[System] [MDS] Malformed Call ID ${uniqueID}: Missing 'Type' field.`, "color: red;");
                    hasMalformedCall = true;
                    break;
                }
                const callType = typeMatch[1];

                // Parse JSON payload
                const jsonMatch = callContent.match(/({[\s\S]*})/);
                if (!jsonMatch) {
                    console.error(`%c[System] [MDS] Malformed Call ID ${uniqueID}: Missing JSON payload.`, "color: red;");
                    hasMalformedCall = true;
                    break;
                }
                const payloadString = jsonMatch[1];
                const payload = JSON.parse(payloadString);

                parsedCalls.push({
                    id: uniqueID,
                    type: callType,
                    payload: payload
                });
                console.log(`%c[System] [MDS] Successfully parsed and validated call ID ${uniqueID}`, "color: green;");

            } catch (error) {
                console.error(`%c[System] [MDS] Malformed Call ID ${uniqueID}: Invalid JSON. Error: ${error.message}`, "color: red;");
                hasMalformedCall = true;
                break;
            }
        }

        if (hasMalformedCall) {
            console.log("%c[System] [MDS] Scan failed. Malformed call detected. Rejecting entire submission.", "background-color: #FFBABA; color: #D8000C;");
            Operations.sendSystemMessage(agentID, "Your last submission failed. Please check your system calls for formatting errors and resubmit.");
            return [];
        }

        console.log(`%c[System] [MDS] Scan complete. Found and validated ${parsedCalls.length} system calls.`, "background-color: #90EE90;");
        return parsedCalls;
    }
}

// Class Export
export {Directory, Scanning};
