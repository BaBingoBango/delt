//
//  MDS.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {Operations, Standards} from "@/SCD";
import React from "react";
import ReactDOM from "react-dom/client";
import ClarificationForm from "@/ClarificationForm";

class Directory {
    constructor() {
        this.agents = new Map();
        this.pendingOrders = new Map();
        this.updateCallback = null;
        this.processedCallIDs = new Set();
        this.messageLog = [];
        this.nextAgentID = 1;
    }

    setUpdateCallback(callback) {
        this.updateCallback = callback;
    }

    setAgentStatus(agentId, status) {
        if (this.agents.has(agentId)) {
            const agent = this.agents.get(agentId);
            agent.status = status;

            // If an agent is generating, set all its superiors to "Awaiting Report"
            if (status === 'Generating...') {
                let superiorId = agent.superiorID;
                while (superiorId && this.agents.has(superiorId)) {
                    const superior = this.agents.get(superiorId);
                    superior.status = 'Awaiting Report';
                    superiorId = superior.superiorID;
                }
            }
            this.triggerUpdate();
        }
    }

    triggerUpdate() {
        if (this.updateCallback) {
            this.updateCallback(Array.from(this.agents.values()));
        }
    }

    generateAgentID() {
        return this.nextAgentID++;
    }

    // Creates a new agent and adds it to the directory. (no security)
    recruitNewAgent(callSign, title, rank, superiorID, subordinateIDs, team) {
        // Generate a unique ID for the agent
        const identifier = this.generateAgentID();

        // Check for a duplicate ID
        if (this.agents.has(identifier)) {
            throw new Error(`Agent with ID ${identifier} already exists.`);
        }

        // Decide a suit of cards at random to assign this agent if not provided
        const agentTeam = team || Standards.agentTeams[
            Object.keys(Standards.agentTeams)[Math.floor(Math.random() * Object.keys(Standards.agentTeams).length)]
        ];

        // Create an agent object
        const agent = {
            identifier: identifier,
            id: identifier,
            chatHistory: [],
            messageLog: [],
            callSign,
            title,
            rank,
            team: agentTeam,
            superiorID,
            subordinateIDs: subordinateIDs || [],
            pendingOrders: [],
            pendingReports: new Map(),
            status: 'Idle',
            unresolvedCalls: [],
        };

        // Add this agent to its superior's list of subordinates
        if (superiorID && this.agents.has(superiorID)) {
            const superiorAgent = this.agents.get(superiorID);
            superiorAgent.subordinateIDs.push(identifier);
        }

        // Finally, add the agent to the directory (map)
        this.agents.set(identifier, agent);
        this.triggerUpdate();
        return identifier;
    }

    debugAgent(agentId) {
        if (!this.agents.has(agentId)) {
            console.error(`%c[Debug] Agent with ID ${agentId} not found.`, 'color: red; font-weight: bold;');
            return;
        }

        const agent = this.agents.get(agentId);

        console.group(`%c[Debug] Agent Details: ${agent.callSign} (${agentId})`, 'color: #1E90FF; font-weight: bold; font-size: 1.2em;');

        console.log('%cBasic Info', 'color: #1E90FF; font-weight: bold;');
        console.log(`  %cTitle:%c ${agent.title}`, 'font-weight: bold;', 'font-weight: normal;');
        console.log(`  %cRank:%c ${agent.rank.name}`, 'font-weight: bold;', 'font-weight: normal;');
        console.log(`  %cTeam:%c ${agent.team.name}`, 'font-weight: bold;', 'font-weight: normal;');
        console.log(`  %cStatus:%c ${agent.status}`, 'font-weight: bold;', 'font-weight: normal;');

        console.log('%cHierarchy', 'color: #1E90FF; font-weight: bold;');
        console.log(`  %cSuperior ID:%c ${agent.superiorID || 'None'}`, 'font-weight: bold;', 'font-weight: normal;');
        console.log(`  %cSubordinate IDs:%c ${agent.subordinateIDs.length > 0 ? agent.subordinateIDs.join(', ') : 'None'}`, 'font-weight: bold;', 'font-weight: normal;');

        console.log('%cComms', 'color: #1E90FF; font-weight: bold;');
        console.log(`  %cPending Orders:%c ${agent.pendingOrders.length}`, 'font-weight: bold;', 'font-weight: normal;');
        console.dir(agent.pendingOrders);
        console.log(`  %cPending Reports:%c ${agent.pendingReports.size}`, 'font-weight: bold;', 'font-weight: normal;');
        console.dir(agent.pendingReports);

        console.log('%cLogs', 'color: #1E90FF; font-weight: bold;');
        console.groupCollapsed('  Chat History');
        console.log(agent.chatHistory);
        console.groupEnd();
        console.groupCollapsed('  Message Log');
        console.log(agent.messageLog);
        console.groupEnd();

        console.groupEnd();
    }
}

class Scanning {
    static async scanAgentResponse(directory, responseText, agentID) {
        console.log(`%c[System] [MDS] Scanning agent response from ID ${agentID}... Response text:`, "background-color: #CBC3E3;");

        const callRegex = /###(.+?)###\s*([\s\S]*?)\s*###\1###/g;
        const matches = [...responseText.matchAll(callRegex)];

        if (matches.length === 0) {
            const agent = directory.agents.get(agentID);
            if (agent && agent.unresolvedCalls.length > 0) {
                console.log(`%c[System] [MDS] Scan complete. No system calls found, but agent has unresolved calls. Allowing blank response.`, "color: gray;");
                return [];
            }
            console.log("%c[System] [MDS] Scan complete. No system calls were found.", "color: gray;");
            Operations.sendSystemMessage(directory, agentID, Standards.systemMessageTypes.BLANK_RESPONSE_WARNING)
            return [];
        } else {
            // Ensure the agent has no unresolved calls before proceeding
            const agent = directory.agents.get(agentID);
            if (agent && agent.unresolvedCalls.length > 0) {
                console.warn(`%c[System] [MDS] Agent ${agentID} has unresolved calls. Rejecting new response with system calls.`, "color: red;");
                Operations.sendSystemMessage(directory, agentID, Standards.systemMessageTypes.RUNAWAY_CALL_WARNING);
                return;
            }
        }

        let hasMalformedCall = false;
        const parsedCalls = [];
        let reasoningText = "";

        console.log(`%c[System] [MDS] Found ${matches.length} potential system calls in the response. Beginning validation pass...`, "color: blue;");
        for (const match of matches) {
            const uniqueID = match[1].trim();
            const callContent = match[2].trim();
            console.log(`%c[System] [MDS] Validating potential system call with ID: ${uniqueID}`, "color: blue;");

            try {
                // (1) Parse & confirm type
                const typeMatch = callContent.match(/Type:\s*(\w+)/);
                if (!typeMatch) {
                    const errorMessage = `Malformed Call ID ${uniqueID}: Missing 'Type' field.`;
                    console.error(`%c[System] [MDS] ${errorMessage}`, "color: red;");
                    reasoningText = errorMessage;
                    hasMalformedCall = true;
                    break;
                }
                const callType = typeMatch[1];

                // (2) Parse JSON payload
                const jsonMatch = callContent.match(/({[\s\S]*})/);
                if (!jsonMatch) {
                    const errorMessage = `Malformed Call ID ${uniqueID}: Missing JSON payload.`;
                    console.error(`%c[System] [MDS] ${errorMessage}`, "color: red;");
                    reasoningText = errorMessage;
                    hasMalformedCall = true;
                    break;
                }
                const payloadString = jsonMatch[1];
                const payload = JSON.parse(payloadString);

                // (3) Send the structured call to inspection
                if (!payload || typeof payload !== 'object') {
                    const errorMessage = `Malformed Call ID ${uniqueID}: Invalid JSON structure.`;
                    console.error(`%c[System] [MDS] ${errorMessage}`, "color: red;");
                    reasoningText = errorMessage;
                    hasMalformedCall = true;
                    break;
                }
                const inspectionResult = await CallSubmissionAndValidation.inspectSystemCall(directory, uniqueID, callType, payload, agentID);
                if (!inspectionResult) {
                    const errorMessage = `Call ID ${uniqueID} failed inspection.`;
                    console.error(`%c[System] [MDS] ${errorMessage}`, "color: red;");
                    reasoningText = errorMessage;
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
                console.log("Inspection Result:", inspectionResult);

            } catch (error) {
                const errorMessage = `Malformed Call ID ${uniqueID}: Invalid JSON. Error: ${error.message}`;
                console.error(`%c[System] [MDS] ${errorMessage}`, "color: red;");
                reasoningText = errorMessage;
                hasMalformedCall = true;
                break;
            }
        }

        if (hasMalformedCall) {
            console.log("%c[System] [MDS] Scan failed. Malformed call detected. Rejecting entire submission and notifying agent.", "background-color: #FFBABA; color: #D8000C;");
            Operations.sendSystemMessage(directory, agentID, Standards.systemMessageTypes.MALFORMED_CALL_WARNING, reasoningText);
            return;
        }

        console.log(`%c[System] [MDS] Scan complete. All ${parsedCalls.length} system calls passed validation. Passing to execution...`, "background-color: #90EE90;");
        await Operations.executeSystemCalls(directory, parsedCalls, agentID);
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
    static async inspectSystemCall(directory, id, type, payload, agentID) {

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

        // Next, check if the agent is authorized to make this call
        const securityPolicy = Standards.systemCallTypes[callType.toUpperCase()].securityPolicy;

        if (securityPolicy === Standards.securityPolicies.CHIEF_ONLY) {
            // Chief Only: Only the Chief can make this call
            if (agent.rank !== Standards.agentRanks.CHIEF) {
                console.warn(`%c[System] [MDS] Call ${id} of type ${type} failed inspection: agent ${agentID} is not the Chief.`, "color: red;");
                return false;
            }

        } else if (securityPolicy === Standards.securityPolicies.NONE) {
            // No specific security policy: Any agent can make this call
            // (No action needed, just continue)

        } else if (securityPolicy === Standards.securityPolicies.ALL_SUPERIORS) {
            // All Superiors: Requires approval from every superior, up to the Chief.
            let currentApprovingAgentID = agent.superiorID;

            // If the agent has no superior, it's the Chief, so no approvals are needed.
            if (!currentApprovingAgentID) {
                console.log(`%c[System] [MDS] Call ${id} of type ${type} made by Chief, no superior approval needed.`, "color: green;");
            }

            while (currentApprovingAgentID) {
                // Confirm the superior agent exists
                if (!directory.agents.has(currentApprovingAgentID)) {
                    console.warn(`%c[System] [MDS] Call ${id} of type ${type} failed inspection: agent ${agentID} has a non-existent superior ${currentApprovingAgentID}.`, "color: red;");
                    return false;
                }
                const approver = directory.agents.get(currentApprovingAgentID);

                // Ask this agent for approval
                const messageContentString = `Agent ${agent.callSign} (${agentID}) is requesting approval for call ID ${id} of type ${type}. Payload: ${JSON.stringify(payload)}`;
                const approvalResponse = await Operations.sendSystemMessage(directory, currentApprovingAgentID, Standards.systemMessageTypes.APPROVAL_REQUEST, messageContentString);
                if (!approvalResponse || !approvalResponse.includes('$$$APPROVED$$$')) {
                    console.warn(`%c[System] [MDS] Call ${id} denied by agent ${approver.callSign} (${currentApprovingAgentID}).`, "color: red;");
                    return false;
                }
                console.log(`%c[System] [MDS] Call ${id} approved by agent ${approver.callSign} (${currentApprovingAgentID}).`, "color: green;");

                // Move to the next superior
                currentApprovingAgentID = approver.superiorID;
            }
            // If loop finishes, all superiors have approved.
            console.log(`%c[System] [MDS] Call ${id} of type ${type} has been approved by all required superiors.`, "color: green;");

        } else if (securityPolicy === Standards.securityPolicies.COMPLETE_CHAIN) {
            // Complete Chain: Requires approval from every superior, including the Chief and the user
            let currentApprovingAgentID = agent.superiorID;

            while (true) {
                // This is the Chief agent, so present the request to the user
                if (!agent.superiorID) {
                    console.warn(`%c[System] [MDS] Call ${id} of type ${type} requires approval from the user.`, "color: red;");
                    try {
                        const userApproved = await CallSubmissionAndValidation.requestUserApproval(agent, type, payload);
                        if (!userApproved) {
                            console.warn(`%c[System] [MDS] Call ${id} of type ${type} denied by the user.`, "color: red;");
                            return false;
                        }
                        console.log(`%c[System] [MDS] Call ${id} of type ${type} approved by the user.`, "color: green;");
                        break; // End of the approval chain
                    } catch (error) {
                        console.error(`%c[System] [MDS] User approval failed for call ${id}. Error: ${error.message}`, "color: red;");
                        return false;
                    }
                }

                // Confirm the superior agent exists
                if (!currentApprovingAgentID || !directory.agents.has(currentApprovingAgentID)) {
                    console.warn(`%c[System] [MDS] Call ${id} of type ${type} failed inspection: agent ${agentID} has no superior to approve this call.`, "color: red;");
                    return false;
                }

                // Ask this agent for approval
                const messageContentString = `Agent ${agent.callSign} (${agentID}) is requesting approval for call ID ${id} of type ${type}. Payload: ${JSON.stringify(payload)}`;
                const approvalResponse = await Operations.sendSystemMessage(directory, currentApprovingAgentID, Standards.systemMessageTypes.APPROVAL_REQUEST, messageContentString);
                if (!approvalResponse || !approvalResponse.includes('$$$APPROVED$$$')) {
                    console.warn(`%c[System] [MDS] Call ${id} denied by agent ${approver.callSign} (${currentApproverId}).`, "color: red;");
                    return false;
                }
                console.log(`%c[System] [MDS] Call ${id} approved by agent ${approver.callSign} (${currentApproverId}).`, "color: green;");

                // Move to the next superior
                const approver = directory.agents.get(currentApprovingAgentID);
                if (approver.superiorID) {
                    currentApprovingAgentID = approver.superiorID;
                } else {
                    // No more superiors, so the call is approved
                    console.log(`%c[System] [MDS] Call ${id} of type ${type} has been approved by all required superiors.`, "color: green;");
                    break;
                }
            }
        }

        // Specific Call-Type Validation
        //
        // This section checks for specific rules that apply to certain call types. For example, Order calls can only
        // be issued to a direct subordinate of the agent making the call, and the recipient agent must exist.
        console.log(`%c[System] [MDS] Performing specific validation for call type ${type}...`, "color: blue;");
        switch (type.toUpperCase()) {
            case Standards.systemCallTypes.ORDER.name.toUpperCase():
                // Normalize recipientAgentID to a number
                const recipientId = Number(payload.recipientAgentID);

                // Make sure the agent being ordered exists
                if (!recipientId || !directory.agents.has(recipientId)) {
                    console.error(`%c[System] [MDS] Call ${id} of type ${type} failed inspection: recipient agent ID ${recipientId} does not exist.`, "color: red;");
                    return false;
                }
                // Make sure the recipient is a subordinate of the caller
                if (!agent.subordinateIDs.includes(recipientId)) {
                    console.error(`%c[System] [MDS] Call ${id} of type ${type} failed inspection: Recipient agent ${recipientId} is not a subordinate of calling agent ${agentID}.`, "color: red;");
                    return false;
                }
                break;
        }

        // If we reach this point, the call has passed inspection!
        return true;
    }

    static requestUserApproval(agent, callType, payload) {
        return new Promise((resolve, reject) => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const root = ReactDOM.createRoot(container);

            const cleanup = () => {
                root.unmount();
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
            };

            const handleConfirm = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false); // Resolve with false instead of rejecting
            };

            const question = `Agent ${agent.callSign} requests approval for a '${callType}' call. Do you approve?`;
            const options = ["Approve"]; // Using ClarificationForm, so need options

            const formElement = React.createElement(ClarificationForm, {
                questions: [question],
                options: [options],
                onConfirm: handleConfirm,
                onCancel: handleCancel,
            });

            root.render(formElement);
        });
    }
}

// Class Export
export {Directory, Scanning, CallSubmissionAndValidation};
