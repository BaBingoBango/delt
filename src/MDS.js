//
//  MDS.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

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
        console.log("%c[System] [MDS] Scanning agent response...", "background-color: #CBC3E3;");
        console.log(responseText);
    }
}

// Class Export
export {Directory, Scanning};
