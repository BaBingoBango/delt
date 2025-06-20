//
//  MDS.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {Operations, Standards} from "@/SCD";

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
        const team = Standards.agentTeams[
            Object.keys(Standards.agentTeams)[Math.floor(Math.random() * Object.keys(Standards.agentTeams).length)]
        ];

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
    static scanAgentResponse(directory, responseText, agentID) {
        console.log(`%c[System] [MDS] Scanning agent response from ID ${agentID}...`, "background-color: #CBC3E3;");
        console.log(responseText);

        // First, save this response to the agent's chat history
        if (!directory.agents.has(agentID)) {
            console.error(`%c[System] [MDS] Agent with ID ${agentID} does not exist. Cannot scan response.`, "color: red;");
            return [];
        }
        const agent = directory.agents.get(agentID);
        agent.chatHistory.push({
            role: "assistant",
            content: responseText,
            timestamp: new Date().toISOString()
        });
        console.log(`%c[System] [MDS] Response saved to agent ${agentID}'s chat history.`, "color: green;");

        const callRegex = /###(.+?)###\s*([\s\S]*?)\s*###\1###/g;
        const matches = [...responseText.matchAll(callRegex)];

        if (matches.length === 0) {
            console.log("%c[System] [MDS] Scan complete. No system calls were found.", "color: gray;");
            console.log(responseText);
            Operations.sendSystemMessage(directory, agentID, Standards.systemMessageTypes.BLANK_RESPONSE_WARNING)
            return [];
        }

        let hasMalformedCall = false;
        const parsedCalls = [];

        for (const match of matches) {
            const uniqueID = match[1].trim();
            const callContent = match[2].trim();
            console.log(`%c[System] [MDS] Found potential system call with ID: ${uniqueID}`, "color: blue;");

            try {
                // (1) Parse & confirm type
                const typeMatch = callContent.match(/Type:\s*(\w+)/);
                if (!typeMatch) {
                    console.error(`%c[System] [MDS] Malformed Call ID ${uniqueID}: Missing 'Type' field.`, "color: red;");
                    hasMalformedCall = true;
                    break;
                }
                const callType = typeMatch[1];

                // (2) Parse JSON payload
                const jsonMatch = callContent.match(/({[\s\S]*})/);
                if (!jsonMatch) {
                    console.error(`%c[System] [MDS] Malformed Call ID ${uniqueID}: Missing JSON payload.`, "color: red;");
                    hasMalformedCall = true;
                    break;
                }
                const payloadString = jsonMatch[1];
                const payload = JSON.parse(payloadString);

                // (3) Send the structured call to inspection
                if (!payload || typeof payload !== 'object') {
                    console.error(`%c[System] [MDS] Malformed Call ID ${uniqueID}: Invalid JSON structure.`, "color: red;");
                    hasMalformedCall = true;
                    break;
                }
                const inspectionResult = CallSubmissionAndValidation.inspectSystemCall(directory, uniqueID, callType, payload, agentID);
                if (!inspectionResult) {
                    console.error(`%c[System] [MDS] Call ID ${uniqueID} failed inspection.`, "color: red;");
                    hasMalformedCall = true;
                    break;
                }

                // All good! Officially add this call to the parsed calls array
                const parsedCall = {
                    id: uniqueID,
                    type: callType,
                    payload: payload,
                    hasClearedInspection: inspectionResult,
                };
                parsedCalls.push(parsedCall);
                console.log(`%c[System] [MDS] Successfully parsed and validated call ID ${uniqueID}`, "color: green;");

            } catch (error) {
                console.error(`%c[System] [MDS] Malformed Call ID ${uniqueID}: Invalid JSON. Error: ${error.message}`, "color: red;");
                hasMalformedCall = true;
                break;
            }
        }

        if (hasMalformedCall) {
            console.log("%c[System] [MDS] Scan failed. Malformed call detected. Rejecting entire submission.", "background-color: #FFBABA; color: #D8000C;");
            console.log(responseText);
            // Operations.sendSystemMessage(agentID, "Your last submission failed. Please check your system calls for formatting errors and resubmit.");
            return [];
        }

        console.log(`%c[System] [MDS] Scan complete. Found and validated ${parsedCalls.length} system calls. Passing to execution...`, "background-color: #90EE90;");
        Operations.executeSystemCalls(directory, parsedCalls, agentID);
    }
}

class CallSubmissionAndValidation {
    // Attempts to award a system call the status of "cleared inspection".
    //
    // ### About Inspection
    //
    // To pass inspection and move to the execution phase, a system call must:
    // - Have a valid type.
    // - Have all arguments required by that type.
    // - Be called by an authorized agent.
    // - Be allowed (e.g. "properly filled out", for instance an agent cannot Order a superior or Recruit themselves).
    //
    // This function does assume that the call has already been parsed and is well-formed.
    static inspectSystemCall(directory, id, type, payload, agentID) {

        // Check that the type exists
        const callType = type;
        if (!Standards.systemCallTypes[callType.toUpperCase()]) {
            console.warn(`%c[System] [MDS] Invalid system call type: ${callType}`, "color: red;");
            console.warn(`Invalid system call type: ${callType}`);
            return false;
        }

        // Check that the payload contains all required arguments
        const requiredArgs = Standards.systemCallTypes[callType.toUpperCase()].parameters;
        for (const arg of requiredArgs) {
            if (!(arg in payload)) {
                console.warn(`%c[System] [MDS] Missing required argument '${arg}' in call ID ${id}`, "color: red;");
                console.warn(`Missing required argument '${arg}' in call ID ${id}`);
                return false;
            }
        }

        // Check that the agent exists
        const agent = directory.agents.get(agentID);
        if (!agent) {
            console.warn(`%c[System] [MDS] Agent with ID ${agentID} does not exist. Cannot inspect call ID ${id}`, "color: red;");
            console.warn(`Agent with ID ${agentID} does not exist.`);
            return false;
        }

        // Check if the agent is allowed to make this call
        const securityPolicy = Standards.systemCallTypes[callType].securityPolicy;
        return true; // TODO: For now, we assume all calls pass inspection. In the future, we can add more checks here.
    }
}

// Class Export
export {Directory, Scanning, CallSubmissionAndValidation};
