//
//  SCD.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {standardInitialMessage} from "../lib/SIM";
import {chiefSystemPrompt} from "../lib/systemPrompts";
import {Scanning} from "@/MDS";

class Standards {
    static systemMessageTypes = {
        SIM: {
            name: "Standard Initial Message"
        }
    }

    static systemCallTypes = {
        CLARIFY: {
            name: "Clarify",
            description: "Request clarification from the user. Requires approval from the Chief-rank agent.",
            arguments: ["callerID", "reasoning"]
        },
        RECRUIT: {
            name: "Recruit",
            description: "Request to recruit a new subordinate agent. Requires approval from all superiors, including the user. Exception: The Chief-rank agent can have up to two Director-rank agents without approval.",
            arguments: ["callerID", "justification"]
        }
    }
}

class Operations {
    static produceSystemMessageString(recipientID, type, messageID, sender, argumentsObject) {
        // Ensure the type is valid
        if (!Object.values(Standards.systemMessageTypes).includes(type)) {
            throw new Error(`Invalid system message type: ${type.name}. (type does not exist)`);
        }

        // Construct a standardized system message string
        return `###${messageID}###
SYSTEM MESSAGE
From: ${sender}
To: ${recipientID}
Type: ${type.name}
##
${JSON.stringify(argumentsObject, null, 2)}
###${messageID}###`;
    };

    static sendSystemMessage(directory, recipientID, type) {
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Message cannot be sent to agent with ID ${recipientID}. (does not exist)`);
        }

        // Switch off the type of system message
        switch (type) {
            case Standards.systemMessageTypes.SIM:
                Operations.sendStandardInitialMessage(directory, recipientID); break;
            default:
                throw new Error(`Cannot deliver system message of type: ${type}. (type does not exist)`);
        }
    }

    static async sendStandardInitialMessage(directory, recipientID) {
        // Ensure the recipient is the Chief-rank agent
        const recipient = directory.agents.get(recipientID);
        if (recipient.rank !== "Chief") {
            throw new Error("Cannot deliver SIM system message. (can only be sent to a Chief-rank agent)");
        }

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            recipientID,
            Standards.systemMessageTypes.SIM,
            "SIM",
            "Standard Initial Message System (SIMS)",
            {
                text: standardInitialMessage
            },
        );

        // Send the message!
        console.log("%c[System] [SCD] Sending SIM message to Chief-rank agent...", "background-color: #CBC3E3;");
        const res = await fetch("/api/awakenAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: chiefSystemPrompt, // TODO: getSystemPrompt(rank, team)
                chatPrompt: messageString,
                chatHistory: recipient.chatHistory,
            })
        });
        if (!res.ok) {
            throw new Error("Failed to send system message. (API request failed)");
        }

        // Process the response!
        const json = await res.json();
        Scanning.scanAgentResponse(json.response, recipientID);
    }
}

// Class Export
export {Standards, Operations};
