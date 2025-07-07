//
//  SCD.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {standardInitialMessage} from "../lib/SIM";
import {Scanning} from "@/MDS";
import {Templates} from "@/DSP";
import React from 'react';
import ReactDOM from 'react-dom/client';
import ClarificationForm from "@/ClarificationForm";
import RecruitmentForm from "@/RecruitmentForm";
import PhaseShiftForm from "@/PhaseShiftForm";
import {Awakening} from "@/Awakening";
import {blankResponseWarningMessage} from "../lib/Blank Response Warning";
import {runawayCallWarningMessage} from "../lib/Runaway Call Warning";
import {malformedCallWarningMessage} from "../lib/Malformed Call Warning";

class Standards {
    static agentRanks = {
        CHIEF: {
            name: "Chief"
        },
        DIRECTOR: {
            name: "Director"
        },
        SUPERVISOR: {
            name: "Supervisor"
        },
        ATTENDANT: {
            name: "Attendant"
        },
        SENIOR_ANALYST: {
            name: "Senior Analyst"
        },
        JUNIOR_ANALYST: {
            name: "Junior Analyst"
        },
        PARTAGAZ: {
            name: "Partagaz A"
        }
    }

    static rankHierarchy = [
        "CHIEF",
        "DIRECTOR",
        "SUPERVISOR",
        "ATTENDANT",
        "SENIOR_ANALYST",
        "JUNIOR_ANALYST"
    ];

    static agentTeams = {
        HEARTS: {
            name: "Hearts"
        },
        DIAMONDS: {
            name: "Diamonds"
        },
        CLUBS: {
            name: "Clubs"
        },
        SPADES: {
            name: "Spades"
        }
    }

    static systemMessageTypes = {
        SIM: {
            name: "Standard Initial Message"
        },
        BLANK_RESPONSE_WARNING: {
            name: "Blank Response Warning",
        },
        CALL_RESULTS: {
            name: "Call Results",
        },
        ORDERS: {
            name: "Orders",
        },
        REPORTING: {
            name: "Reporting",
        },
        APPROVAL_REQUEST: {
            name: "Approval Request",
        },
        MALFORMED_CALL_WARNING: {
            name: "Malformed Call Warning",
        },
        RUNAWAY_CALL_WARNING: {
            name: "Runaway Call Warning",
        }
    }

    static securityPolicies = {
        NONE: {
            description: "Requires no authority. Any agent can execute this call without approval.",
        },
        ALL_SUPERIORS: {
            description: "Requires approval from every superior.",
        },
        COMPLETE_CHAIN: {
            description: "Requires approval from every superior as well as the user.",
        },
        RECRUITMENT: {
            description: "Requires approval from every superior as well as the user. Exception: The Chief-rank agent can have up to two Director-rank agents without approval",
        },
        CHIEF_ONLY: {
            description: "Only the Chief-rank agent can use this call.",
        }
    }

    static systemCallTypes = {
        REFUSE: {
            name: "Refuse",
            description: "Refuse an order from the user or a superior agent due to safety or program policies",
            parameters: ["reasoning"],
            securityPolicy: Standards.securityPolicies.NONE
        },
        CLARIFY: {
            name: "Clarify",
            description: "Request clarification from the user.",
            guidance: "Requires approval of all agent superiors. The questions and options arrays should be of equal length. If options are not provided (submit []), the questions should be open-ended.",
            parameters: ["reasoning", "questions", "options"],
            securityPolicy: Standards.securityPolicies.ALL_SUPERIORS
        },
        RECRUIT: {
            name: "Recruit",
            description: "Request to recruit a new direct subordinate agent. The rank will be one lower than the caller's rank. The title is caller-chosen and should describe the role of the new agent.",
            parameters: ["justification", "title"],
            securityPolicy: Standards.securityPolicies.RECRUITMENT
        },
        ORDER: {
            name: "Order",
            description: "Instruct a subordinate agent to perform a task. The orderString should be clear, concise instructions. Will fail if there are no subordinates.",
            parameters: ["orderString", "recipientAgentID"],
            securityPolicy: Standards.securityPolicies.NONE
        },
        REPORT: {
            name: "Report",
            description: "Submit a report to your direct superior in response to an order.",
            parameters: ["reportString", "originalOrderID"],
            securityPolicy: Standards.securityPolicies.NONE
        },
        PHASE: {
            name: "Phase",
            description: "Request to move from the Planning to Execution phase.",
            parameters: ["justification", "depString"],
            securityPolicy: Standards.securityPolicies.CHIEF_ONLY
        }
    }
}

class Operations {
    // A list of random names for new agents.
    static randomAgentNames = [
        "Krennic",
        "Tarkin",
        "Thrawn",
        "Vader",
        "Meero",
        "Heert",
        "Jung",
        "Lagret",
        "Gideon",
        "Pryce",
        "Yularen",
        "Motti",
        "Tagge",
        "Ozzel",
        "Vanto",
        "Kallus",
        "Rax",
        "Sloane",
        "Drayven",
        "Valerius",
        "Kaelen",
        "Seratt",
        "Vorne",
        "Joric",
        "Lystra",
        "Grymm",
        "Orland",
    ];

    // Constructs a standardized system message string for sending to agents.
    static produceSystemMessageString(directory, recipientID, type, messageID, sender, argumentsObject) {
        // Ensure the type is valid
        if (!Object.values(Standards.systemMessageTypes).includes(type)) {
            throw new Error(`Invalid system message type: ${type.name}. (type does not exist)`);
        }

        // Construct a standardized system message string
        const message = `###${messageID}###
SYSTEM MESSAGE
From: ${sender}
To: ${recipientID}
Type: ${type.name}
##
${JSON.stringify(argumentsObject, null, 2)}
###${messageID}###`;

        // Log the message to the central directory log
        if (directory) {
            directory.messageLog.push(message);
        }

        return message;
    };

    // Generic function to send a system message to an agent; switches to specific functions.
    static sendSystemMessage(directory, recipientID, type, messageContent = "") {
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Message cannot be sent to agent with ID ${recipientID}. (does not exist)`);
        }

        // Switch off the type of system message
        switch (type) {
            case Standards.systemMessageTypes.SIM:
                Operations.sendStandardInitialMessage(directory, recipientID).then(() => {}); break;
            case Standards.systemMessageTypes.BLANK_RESPONSE_WARNING:
                Operations.sendBlankResponseWarningMessage(directory, recipientID).then(() => {}); break;
            case Standards.systemMessageTypes.RUNAWAY_CALL_WARNING:
                Operations.sendRunawayCallWarningMessage(directory, recipientID).then(() => {}); break;
            case Standards.systemMessageTypes.CALL_RESULTS:
                Operations.sendCallResultsMessage(directory, recipientID, messageContent).then(() => {}); break;
                break;
            case Standards.systemMessageTypes.REPORTING:
                // This is handled by executeReportCall, not directly.
                break;
            case Standards.systemMessageTypes.APPROVAL_REQUEST:
                return Operations.sendApprovalRequestMessage(directory, recipientID, messageContent).then(() => {}); break;
            case Standards.systemMessageTypes.MALFORMED_CALL_WARNING:
                Operations.sendMalformedCallWarningMessage(directory, recipientID, messageContent).then(() => {});
                break;
            default:
                throw new Error(`Cannot deliver system message of type: ${type}. (type does not exist)`);
        }
    }

    // Sends a standard initial message (SIM) to the Chief-rank agent.
    static async sendStandardInitialMessage(directory, recipientID) {
        // Ensure the recipient is the Chief-rank agent
        const recipient = directory.agents.get(recipientID);
        if (recipient.rank !== Standards.agentRanks.CHIEF) {
            throw new Error("Cannot deliver SIM system message. (can only be sent to a Chief-rank agent)");
        }

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.SIM,
            "STANDARD INITIAL MESSAGE",
            "User Jump Squad",
            {
                text: standardInitialMessage
            },
        );

        // Send the message!
        console.log("%c[System] [SCD] Sending SIM message to Chief-rank agent...", "background-color: #CBC3E3;");
        const response = await Awakening.awakenAgent(directory, recipient, messageString);
        await Scanning.scanAgentResponse(directory, response, recipientID);
    }

    static async sendApprovalRequestMessage(directory, recipientID, messageContent) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send blank response warning to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.APPROVAL_REQUEST,
            "APPROVAL_REQUEST",
            "Inspection Department, Message Dispatch Service",
            {
                text: messageContent,
            },
        );

        // Send the message!
        console.log("%c[System] [SCD] Sending malformed call warning message...", "background-color: #CBC3E3;");
        const response = await Awakening.awakenAgent(directory, recipient, messageString);
        return response;
    }

    static async sendBlankResponseWarningMessage(directory, recipientID) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send blank response warning to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.BLANK_RESPONSE_WARNING,
            "BLANK_RESPONSE_WARNING",
            "Scanning Department, Message Dispatch Service",
            {
                text: blankResponseWarningMessage,
            },
        );

        // Send the message!
        console.log("%c[System] [SCD] Sending blank response warning message...", "background-color: #CBC3E3;");
        const response = await Awakening.awakenAgent(directory, recipient, messageString);
        await Scanning.scanAgentResponse(directory, response, recipientID);
    }

    static async sendRunawayCallWarningMessage(directory, recipientID) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send blank response warning to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.RUNAWAY_CALL_WARNING,
            "RUNAWAY_CALL_WARNING",
            "Scanning Department, Message Dispatch Service",
            {
                text: runawayCallWarningMessage,
            },
        );

        // Send the message!
        console.log("%c[System] [SCD] Sending runaway call warning message...", "background-color: #CBC3E3;");
        const response = await Awakening.awakenAgent(directory, recipient, messageString);
        await Scanning.scanAgentResponse(directory, response, recipientID);
    }

    static async sendMalformedCallWarningMessage(directory, recipientID, messageContent) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send blank response warning to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.MALFORMED_CALL_WARNING,
            "MALFORMED_CALL_WARNING",
            "Scanning Department, Message Dispatch Service",
            {
                text: malformedCallWarningMessage + messageContent,
            },
        );

        // Send the message!
        console.log("%c[System] [SCD] Sending malformed call warning message...", "background-color: #CBC3E3;");
        const response = await Awakening.awakenAgent(directory, recipient, messageString);
        await Scanning.scanAgentResponse(directory, response, recipientID);
    }

    static async sendOrderMessage(directory, recipientID, orderString, originalCallID, senderID) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send order to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);
        const sender = directory.agents.get(senderID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.ORDERS,
            `ORDER-${originalCallID}`,
            `Agent ${sender.callSign} (${senderID})`,
            {
                orderString: orderString,
                orderID: originalCallID
            }
        );

        // Add the user message to the agent's history
        recipient.chatHistory.push({
            role: "user",
            content: messageString,
        });

        // Get the system prompt
        const systemPrompt = await Templates.getSystemPrompt(recipient.rank, recipient.team);

        // Send the message!
        console.log("%c[System] [SCD] Sending order from ${senderID} to agent ${recipientID}...", "background-color: #CBC3E3;");
        directory.setAgentStatus(recipientID, "Generating...");
        const res = await fetch("/api/awakenAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: systemPrompt,
                chatPrompt: messageString,
                chatHistory: recipient.chatHistory,
                messageLog: directory.messageLog,
            })
        });
        if (!res.ok) {
            directory.setAgentStatus(recipientID, "Idle");
            throw new Error("Failed to send system message. (API request failed)");
        }

        // Process the response!
        const json = await res.json();
        directory.setAgentStatus(recipientID, "Idle");
        Scanning.scanAgentResponse(directory, json.response, recipientID);
    }

    static async sendReportingMessage(directory, recipientID, reportString, originalOrderID, senderID) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send report to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);
        const sender = directory.agents.get(senderID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.REPORTING,
            `REPORT-${originalOrderID}`,
            `Agent ${sender.callSign} (${senderID})`,
            {
                reportString: reportString,
                originalOrderID: originalOrderID
            }
        );

        // Add the user message to the agent's history
        recipient.chatHistory.push({
            role: "user",
            content: messageString,
        });

        // Get the system prompt
        const systemPrompt = await Templates.getSystemPrompt(recipient.rank, recipient.team);

        // Send the message!
        console.log(`%c[System] [SCD] Sending report from ${senderID} to agent ${recipientID}...`, "background-color: #CBC3E3;");
        directory.setAgentStatus(recipientID, "Generating...");
        const res = await fetch("/api/awakenAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: systemPrompt,
                chatPrompt: messageString,
                chatHistory: recipient.chatHistory,
                messageLog: directory.messageLog,
            })
        });
        if (!res.ok) {
            directory.setAgentStatus(recipientID, "Idle");
            throw new Error("Failed to send system message. (API request failed)");
        }

        // Process the response!
        const json = await res.json();
        directory.setAgentStatus(recipientID, "Idle");
        Scanning.scanAgentResponse(directory, json.response, recipientID);
    }

    static async sendCallResultsMessage(directory, recipientID, messageContent) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send call results to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.CALL_RESULTS,
            `CALL_RESULTS-${new Date().toISOString()}`,
            "Operations Department, System Call Directorate",
            {
                result: messageContent
            }
        );

        // Send the message!
        console.log("%c[System] [SCD] Sending call results message...", "background-color: #CBC3E3;");
        const response = await Awakening.awakenAgent(directory, recipient, messageString);
        await Scanning.scanAgentResponse(directory, response, recipientID);
    }

    // Executes a system call package on behalf of an agent. Presumes calls are well-formed and inspected.
    //
    // Calls are executed asynchronously but results are reported back to the agent in a single message (Call Results).
    static async executeSystemCalls(directory, parsedCalls, agentID) {
        // Ensure the agent exists
        if (!directory.agents.has(agentID)) {
            throw new Error(`Cannot execute system calls for agent with ID ${agentID}. (does not exist)`);
        }

        // Update the agent's file with the submitted calls; agents cannot make new calls while they have pending ones
        const agent = directory.agents.get(agentID);
        agent.status = `${parsedCalls.length} Unresolved Calls`;
        agent.unresolvedCalls = parsedCalls;
        directory.triggerUpdate();
        console.log(`%c[System] [SCD] Processing ${parsedCalls.length} system calls for agent ${agentID}. Call object:`, "background-color: #CBC3E3;");
        console.log(parsedCalls);

        // Set up the async execution objects
        const callPromises = parsedCalls.map(async (call) => {
            try {
                console.log(`%c[System] [SCD] Switching & executing call: ${call.type} (${call.id})`, "background-color: #CBC3E3;");
                switch (call.type.toUpperCase()) {
                    case Standards.systemCallTypes.ORDER.name.toUpperCase():
                        return await Operations.executeOrderCall(directory, call, agentID);
                    case Standards.systemCallTypes.REPORT.name.toUpperCase():
                        return await Operations.executeReportCall(directory, call, agentID);
                    case Standards.systemCallTypes.CLARIFY.name.toUpperCase():
                        return await Operations.executeClarifyCall(directory, call, agentID);
                    case Standards.systemCallTypes.RECRUIT.name.toUpperCase():
                        return await Operations.executeRecruitCall(directory, call, agentID);
                    case Standards.systemCallTypes.PHASE.name.toUpperCase():
                        return await Operations.executePhaseCall(directory, call, agentID);
                    default:
                        return { callID: call.id, status: "UNKNOWN_CALL_TYPE", details: `Call type ${call.type} is not handled.` };
                }
            } catch (error) {
                console.error(`%c[System] [SCD] Failed to execute call ${call.id} of type ${call.type}. Error: ${error.message}`, "color: red;");
                return {
                    callID: call.id,
                    status: "FAILED",
                    error: error.message
                };
            }
        });

        // Wait for all calls to settle
        const results = await Promise.all(callPromises);

        // All calls have been processed, now update the agent's state
        agent.unresolvedCalls = [];
        directory.setAgentStatus(agentID, "Idle");
        console.log(`%c[System] [SCD] All initial calls for agent ${agentID} have been resolved.`, "background-color: #90EE90;");

        // Send one consolidated report of all call results back to the agent
        console.log(`%c[System] [SCD] Consolidated call results for agent ${agentID}:`, "background-color: #90EE90;", results);
        await Operations.sendCallResultsMessage(directory, agentID, JSON.stringify({ results }, null, 2));
    }

    static async executeOrderCall(directory, parsedCall, agentID) {
        console.log(`%c[System] [SCD] Executing Order call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
        const { orderString, recipientAgentID } = parsedCall.payload;
        const agent = directory.agents.get(agentID);
        agent.pendingOrders.push(parsedCall.id);
        // await Operations.sendOrderMessage(directory, recipientAgentID, orderString, parsedCall.id, agentID);
        return {
            callID: parsedCall.id,
            status: "FAILURE",
            details: `TODO: Not implemented. Order for agent ${recipientAgentID} with ID ${parsedCall.id} was not sent.`
        };
    }

    static async executeReportCall(directory, parsedCall, agentID) {
        console.log(`%c[System] [SCD] Executing Report call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
        const { reportString, originalOrderID } = parsedCall.payload;
        const reportingAgent = directory.agents.get(agentID);

        if (!reportingAgent.superiorID) {
            throw new Error(`Agent ${agentID} has no superior to report to.`);
        }

        const superior = directory.agents.get(reportingAgent.superiorID);
        if (!superior) {
            throw new Error(`Superior agent with ID ${reportingAgent.superiorID} not found.`);
        }

        // Forward the report to the superior.
        await Operations.sendReportingMessage(directory, superior.identifier, reportString, originalOrderID, agentID);

        // Remove the original order ID from the superior's list of pending orders.
        superior.pendingOrders = superior.pendingOrders.filter(id => id !== originalOrderID);

        return {
            callID: parsedCall.id,
            status: "SUCCESS",
            details: `Report for order ${originalOrderID} sent to superior ${superior.identifier}.`
        };
    }

    static executeClarifyCall(directory, parsedCall, agentID) {
        return new Promise((resolve, reject) => {
            console.log(`%c[System] [SCD] Executing Clarify call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");

            const agent = directory.agents.get(agentID);
            if (agent.rank !== Standards.agentRanks.CHIEF) {
                console.log(`%c[System] [SCD] Agent ${agentID} is not Chief. Forwarding Clarify call for approval.`, "background-color: #CBC3E3;");
                Operations.sendApprovalRequestMessage(directory, agent.superiorID, parsedCall, agentID).then(() => {
                    resolve({
                        callID: parsedCall.id,
                        status: "PENDING_APPROVAL",
                        details: "Request for clarification has been forwarded to your superior for approval."
                    });
                }).catch(error => {
                    reject(error);
                });
                return;
            }

            const { questions, options } = parsedCall.payload;

            // Create a container for the React component
            const container = document.createElement('div');
            document.body.appendChild(container);

            const root = ReactDOM.createRoot(container);

            const cleanup = () => {
                root.unmount();
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
            };

            const handleConfirm = (responses) => {
                cleanup();
                console.log("%c[System] [SCD] User provided clarification:", "background-color: #90EE90;", responses);
                resolve({
                    callID: parsedCall.id,
                    status: "SUCCESS",
                    responses: responses
                });
            };

            const handleCancel = () => {
                cleanup();
                console.warn(`%c[System] [SCD] Clarification cancelled by user.`, "color: orange;");
                reject(new Error("Clarification cancelled by user."));
            };

            const formElement = React.createElement(ClarificationForm, {
                questions,
                options,
                onConfirm: handleConfirm,
                onCancel: handleCancel,
            });

            root.render(formElement);
        });
    }

    static executePhaseCall(directory, parsedCall, agentID) {
        return new Promise((resolve, reject) => {
            console.log(`%c[System] [SCD] Executing Phase call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");

            // In a full implementation, this would find the Partagaz agent and send them a system message.
            // For now, we simulate this by logging and then proceeding to the user form.
            console.log(`%c[System] [SCD] Phase shift request from Chief. Forwarding to Partagaz A for internal review...`, "background-color: #ADD8E6;");

            const { justification, depString } = parsedCall.payload;

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
                console.log("%c[System] [SCD] User approved phase shift.", "background-color: #90EE90;");
                // Here you would update the firm-wide phase in the directory
                // directory.setPhase("EXECUTION");
                resolve({
                    callID: parsedCall.id,
                    status: "SUCCESS",
                    details: "Phase shift to EXECUTION approved by user."
                });
            };

            const handleCancel = () => {
                cleanup();
                console.warn(`%c[System] [SCD] Phase shift denied by user.`, "color: orange;");
                resolve({
                    callID: parsedCall.id,
                    status: "DENIED",
                    details: "Phase shift to EXECUTION was denied by the user."
                });
            };

            const formElement = React.createElement(PhaseShiftForm, {
                justification,
                depString,
                onConfirm: handleConfirm,
                onCancel: handleCancel,
            });

            root.render(formElement);
        });
    }

    static executeRecruitCall(directory, parsedCall, agentID) {
        return new Promise((resolve, reject) => {
            console.log(`%c[System] [SCD] Executing Recruit call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");

            const callingAgent = directory.agents.get(agentID);
            const currentRankIndex = Standards.rankHierarchy.indexOf(callingAgent.rank.name.toUpperCase().replace(' ', '_'));

            if (currentRankIndex === -1 || currentRankIndex === Standards.rankHierarchy.length - 1) {
                return reject(new Error("Calling agent has the lowest rank and cannot recruit."));
            }

            const newAgentRankName = Standards.rankHierarchy[currentRankIndex + 1];
            const newAgentRank = Standards.agentRanks[newAgentRankName];
            const newAgentCallSign = Operations.randomAgentNames[Math.floor(Math.random() * Operations.randomAgentNames.length)];
            const newAgentTeam = Standards.agentTeams[Object.keys(Standards.agentTeams)[Math.floor(Math.random() * Object.keys(Standards.agentTeams).length)]];

            const { justification, title } = parsedCall.payload;

            const newAgentDetails = {
                callSign: newAgentCallSign,
                title: title,
                rank: newAgentRank,
                team: newAgentTeam
            };

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
                console.log("%c[System] [SCD] User approved recruitment:", "background-color: #90EE90;", newAgentDetails);
                try {
                    const newAgentID = directory.recruitNewAgent(
                        newAgentDetails.callSign,
                        newAgentDetails.title,
                        newAgentDetails.rank,
                        agentID,
                        [],
                        newAgentDetails.team
                    );
                    console.log(`%c[System] [SCD] Successfully recruited new agent with ID: ${newAgentID}`, "background-color: #90EE90;");
                    resolve({
                        callID: parsedCall.id,
                        status: "SUCCESS",
                        details: `Recruitment approved. New agent ${newAgentDetails.callSign} (${newAgentID}) has been recruited with rank ${newAgentDetails.rank.name}.`
                    });
                } catch (error) {
                    console.error(`%c[System] [SCD] Failed to recruit new agent. Error: ${error.message}`, "color: red;");
                    reject(error);
                }
            };

            const handleCancel = () => {
                cleanup();
                console.warn(`%c[System] [SCD] Recruitment denied by user.`, "color: orange;");
                reject(new Error("Recruitment denied by user."));
            };

            const formElement = React.createElement(RecruitmentForm, {
                justification,
                newAgentDetails,
                onConfirm: handleConfirm,
                onCancel: handleCancel,
            });

            root.render(formElement);
        });
    }
}

// Class Export
export {Standards, Operations};
