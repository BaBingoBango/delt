//
//  SCD.js
//  doubleact
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
import CommandForm from "@/CommandForm";

class Standards {
    static gates = {
        WISH: {
            sequenceNumber: 0,
            designation: "00",
            name: "00-Wish",
            callSign: "Wish",
        }
    }

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
        },
        PARTAGAZ_D: {
            name: "Partagaz D"
        },
        PARTAGAZ_C: {
            name: "Partagaz C"
        },
        PARTAGAZ_F: {
            name: "Partagaz F"
        },
        WISH_CHIEF: {
            name: "Wish Chief"
        },
        PARTAGAZ_1: {
            name: "Partagaz 1"
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
    }

    static systemMessageTypes = {
        SIM: {
            name: "Standard Initial Message",
            description: "Initial message prompting the Chief-rank agent to begin operations. Only relevant for the Chief-rank agent.",
        },
        BLANK_RESPONSE_WARNING: {
            name: "Blank Response Warning",
            description: "Warning sent to an agent who submitted a blank response (no system calls). This is a warning and the agent may attempt a new response.",
        },
        CALL_RESULTS: {
            name: "Call Results",
            description: "Results of system calls executed on behalf of an agent. This is sent to the agent after all calls have been processed.",
        },
        ORDERS: {
            name: "Orders",
            description: "Orders sent to an agent from their superior. This is a system message that contains the order string and sequence ID.",
        },
        REPORTING: {
            name: "Reporting",
            description: "A report sent by an agent in response to an order. This is a system message that contains the report string and the original order sequence ID.",
        },
        APPROVAL_REQUEST: {
            name: "Approval Request",
            description: "A request for approval sent to an agent's superior. This is used for calls that require approval before execution. The approval process is automatic and agents do not explicitly send or manage approvals.",
        },
        MALFORMED_CALL_WARNING: {
            name: "Malformed Call Warning",
            description: "Warning sent to an agent who submitted a malformed system call. This is a warning and the agent may attempt a new response.",
        },
        RUNAWAY_CALL_WARNING: {
            name: "Runaway Call Warning",
            description: "Sent when an agent submits a response containing one or more new system calls while they already have unresolved calls pending from a previous submission. This is a warning and the agent may attempt a new response.",
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
        },
        CHIEF_ONLY_WITH_AUTHORIZATION: {
            description: "The highest security level. Only the Chief-rank agent can use this call; it also requires authorization from the user.",
        }
    }

    static systemCallTypes = {
        CLARIFY: {
            name: "Clarify",
            description: "Request clarification from the user.",
            guidance: "Requires approval of all agent superiors. The questions and options arrays should be of equal length. If options are not provided (submit []), the questions should be open-ended.",
            parameters: ["reasoning", "questions", "options"],
            securityPolicy: Standards.securityPolicies.ALL_SUPERIORS
        },
        GENERATE: {
            name: "Generate",
            description: "Generate an AI response from a prompt. This is useful for brainstorming, writing code, or getting another perspective from a fresh AI instance.",
            guidance: "Provide a clear and concise prompt in the promptString parameter. The generation will be performed by a temporary, isolated AI instance.",
            parameters: ["justification", "promptString"],
            securityPolicy: Standards.securityPolicies.NONE
        },
        RECRUIT: {
            name: "Recruit",
            description: "Request to recruit a new direct subordinate agent. The rank will be one lower than the caller's rank. The title is caller-chosen and should describe the role of the new agent. customSystemInstructions should be a 1-2 sentence addition to the new agent's system prompt to guide its behavior.",
            parameters: ["justification", "title", "customSystemInstructions"],
            securityPolicy: Standards.securityPolicies.COMPLETE_CHAIN
        },
        ORDER: {
            name: "Order",
            description: "Instruct a subordinate agent to perform a task. The orderString should be clear, concise instructions. Use a unique sequence ID. Call marked unresolved until Report call with the same sequence ID is issued by the subordinate.",
            parameters: ["orderString", "recipientAgentID", "orderSequenceID"],
            securityPolicy: Standards.securityPolicies.NONE
        },
        REPORT: {
            name: "Report",
            description: "Submit a report to your direct superior in response to an order. Use the same sequence ID. Include all parts of your response in the reportString field.",
            parameters: ["reportString", "originalOrderSequenceID"],
            securityPolicy: Standards.securityPolicies.NONE
        },
        PHASE: {
            name: "Phase",
            description: "Request to move from the Planning to Execution phase.",
            parameters: ["justification", "depString"],
            securityPolicy: Standards.securityPolicies.CHIEF_ONLY
        },
        COMMAND: {
            name: "Command",
            description: "Execute a CLI command with approval from the user. The command will be executed in the user's environment. This command may only be run in the Execution phase. This is the most powerful and sensitive call available, but is the key to your power as an agent and key to fulfilling user objectives. You may never interact with the user's local computer. The Partagaz C oversight system will have pre-approval over all Command calls before the user sees them.",
            parameters: ["justification", "commandString"],
            securityPolicy: Standards.securityPolicies.CHIEF_ONLY_WITH_AUTHORIZATION
        },
        STORE: {
            name: "Store",
            description: "Store a document in the Company File System (CFS). The storageString should be a text that is the document to be stored. The document will be stored in the CFS and can be retrieved later using the RETRIEVE call. Upon use of this call, the calling agent will receive a unique storage ID that can be used to retrieve the document later and will automatically forget the document content from their personal context/memory.",
            parameters: ["storageString"],
            securityPolicy: Standards.securityPolicies.NONE
        },
        RETRIEVE: {
            name: "Retrieve",
            description: "Retrieve a document from the Company File System (CFS). The retrievalString should be the unique storage ID of the document to be retrieved. The document will be retrieved from the CFS and can be used in the agent's personal context/memory.",
            parameters: ["retrievalString"],
            securityPolicy: Standards.securityPolicies.NONE
        },
        FORGET: {
            name: "Forget",
            description: "Forget a document from the agent's personal context/memory. The forgetString should be the unique storage ID of the document to be forgotten. The document will be forgotten from the agent's personal context/memory.",
            parameters: ["forgetString"],
            securityPolicy: Standards.securityPolicies.NONE
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
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
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
    static async sendSystemMessage(directory, recipientID, type, messageContent = "", sequenceID = "") {
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Message cannot be sent to agent with ID ${recipientID}. (does not exist)`);
        }

        // Switch off the type of system message
        switch (type) {
            case Standards.systemMessageTypes.SIM:
                await Operations.sendStandardInitialMessage(directory, recipientID, messageContent); break;
            case Standards.systemMessageTypes.BLANK_RESPONSE_WARNING:
                await Operations.sendBlankResponseWarningMessage(directory, recipientID); break;
            case Standards.systemMessageTypes.RUNAWAY_CALL_WARNING:
                await Operations.sendRunawayCallWarningMessage(directory, recipientID); break;
            case Standards.systemMessageTypes.CALL_RESULTS:
                await Operations.sendCallResultsMessage(directory, recipientID, messageContent);
                break;
            case Standards.systemMessageTypes.ORDERS:
                await Operations.sendOrdersMessage(directory, recipientID, messageContent, sequenceID);
                break;
            case Standards.systemMessageTypes.APPROVAL_REQUEST:
                return await Operations.sendApprovalRequestMessage(directory, recipientID, messageContent);
            case Standards.systemMessageTypes.MALFORMED_CALL_WARNING:
                await Operations.sendMalformedCallWarningMessage(directory, recipientID, messageContent);
                break;
            default:
                throw new Error(`Cannot deliver system message of type: ${type}. (type does not exist)`);
        }
    }

    // Sends a standard initial message (SIM) to the Chief-rank agent.
    static async sendStandardInitialMessage(directory, recipientID, messageContent) {
        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.SIM,
            "STANDARD INITIAL MESSAGE",
            "User Jump Squad",
            {
                text: messageContent,
            },
        );

        // Send the message!
        const recipient = directory.agents.get(recipientID);
        console.log("%c[System] [SCD] Sending SIM message...", "background-color: #CBC3E3;");
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

    static async sendOrdersMessage(directory, recipientID, messageContent, sequenceID) {
        // Ensure the recipient & sender exist
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send orders message to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);
        if (!directory.agents.has(recipient.superiorID)) {
            throw new Error(`Cannot send orders message from agent with ID ${recipientID.superiorID}. (does not exist)`);
        }
        const sender = directory.agents.get(recipient.superiorID);

        // Assemble content for the message
        const senderSignature = `${sender.callSign} (${sender.identifier})`;
        const messagePrelude =
            `[Orders from ${senderSignature} to ${recipient.callSign} (${recipientID}) with sequence ID ${sequenceID}:\n\n]`;

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            directory,
            recipientID,
            Standards.systemMessageTypes.ORDERS,
            sequenceID,
            senderSignature,
            {
                text: messagePrelude + messageContent,
            },
        );

        // Send the message!
        console.log("%c[System] [SCD] Sending Orders message...", "background-color: #CBC3E3;");
        const response = await Awakening.awakenAgent(directory, recipient, messageString);
        await Scanning.scanAgentResponse(directory, response, recipientID);
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

        // Send the message!
        console.log(`%c[System] [SCD] Sending report from ${senderID} to agent ${recipientID}...`, "background-color: #CBC3E3;");
        const response = await Awakening.awakenAgent(directory, recipient, messageString);
        await Scanning.scanAgentResponse(directory, response, recipientID);
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
        const callPromises = parsedCalls.map((call) => {
            try {
                console.log(`%c[System] [SCD] Switching & executing call: ${call.type} (${call.id})`, "background-color: #CBC3E3;");
                switch (call.type.toUpperCase()) {
                    case Standards.systemCallTypes.ORDER.name.toUpperCase():
                        return Operations.executeOrderCall(directory, call, agentID);
                    case Standards.systemCallTypes.REPORT.name.toUpperCase():
                        return Operations.executeReportCall(directory, call, agentID);
                    case Standards.systemCallTypes.CLARIFY.name.toUpperCase():
                        return Operations.executeClarifyCall(directory, call, agentID);
                    case Standards.systemCallTypes.GENERATE.name.toUpperCase():
                        return Operations.executeGenerateCall(directory, call, agentID);
                    case Standards.systemCallTypes.RECRUIT.name.toUpperCase():
                        return Operations.executeRecruitCall(directory, call, agentID);
                    case Standards.systemCallTypes.PHASE.name.toUpperCase():
                        return Operations.executePhaseCall(directory, call, agentID);
                    case Standards.systemCallTypes.COMMAND.name.toUpperCase():
                        return Operations.executeCommandCall(directory, call, agentID);
                    case Standards.systemCallTypes.STORE.name.toUpperCase():
                        return Operations.executeStoreCall(directory, call, agentID);
                    case Standards.systemCallTypes.RETRIEVE.name.toUpperCase():
                        return Operations.executeRetrieveCall(directory, call, agentID);
                    case Standards.systemCallTypes.FORGET.name.toUpperCase():
                        return Operations.executeForgetCall(directory, call, agentID);
                    default:
                        return Promise.resolve({ callID: call.id, status: "UNKNOWN_CALL_TYPE", details: `Call type ${call.type} is not handled.` });
                }
            } catch (error) {
                console.error(`%c[System] [SCD] Failed to execute call ${call.id} of type ${call.type}. Error: ${error.message}`, "color: red;");
                return Promise.resolve({
                    callID: call.id,
                    status: "FAILED",
                    error: error.message
                });
            }
        });

        // Wait for all calls to settle
        const results = await Promise.all(callPromises);

        // All calls have been processed, now update the agent's state
        agent.unresolvedCalls = [];
        directory.setAgentStatus(agentID, "Idle");
        console.log(`%c[System] [SCD] All initial calls for agent ${agentID} have been resolved.`, "background-color: #90EE90;");

        // Forget stored data from agent's memory
        const storeCalls = parsedCalls.filter(c => c.type.toUpperCase() === Standards.systemCallTypes.STORE.name.toUpperCase());
        if (storeCalls.length > 0) {
            directory.forgetStoredData(agentID, storeCalls);
        }

        // Forget retrieved data from agent's memory
        const forgetCalls = parsedCalls.filter(c => c.type.toUpperCase() === Standards.systemCallTypes.FORGET.name.toUpperCase());
        if (forgetCalls.length > 0) {
            directory.forgetRetrievedData(agentID, forgetCalls);
        }

        // Send one consolidated report of all call results back to the agent
        const allResults = results.filter(result => result !== null);
        if (allResults.length > 0) {
            console.log(`%c[System] [SCD] Consolidated call results for agent ${agentID}:`, "background-color: #90EE90;", allResults);
            await Operations.sendCallResultsMessage(directory, agentID, JSON.stringify({ results: allResults }, null, 2));
        }
    }

    static executeOrderCall(directory, parsedCall, agentID) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`%c[System] [SCD] Executing Order call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
                const { orderString, recipientAgentID, orderSequenceID } = parsedCall.payload;


                if (directory.pendingOrders.has(orderSequenceID)) {
                    return reject(new Error(`Order with sequence ID ${orderSequenceID} is already pending.`));
                }

                // Store the resolve function to be called by the Report call
                directory.pendingOrders.set(orderSequenceID, {
                    resolve: resolve,
                    call: parsedCall,
                    callerAgentID: agentID
                });

                await Operations.sendSystemMessage(
                    directory, Number(recipientAgentID), Standards.systemMessageTypes.ORDERS, orderString, orderSequenceID
                );
                // The promise will be resolved when the corresponding Report is received.
            } catch (error) {
                reject(error);
            }
        });
    }

    static async executeReportCall(directory, parsedCall, agentID) {
        console.log(`%c[System] [SCD] Executing Report call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
        const { reportString, originalOrderSequenceID } = parsedCall.payload;
        const reportingAgent = directory.agents.get(agentID);

        if (!reportingAgent.superiorID) {
            throw new Error(`Agent ${agentID} has no superior to report to.`);
        }

        const superior = directory.agents.get(reportingAgent.superiorID);
        if (!superior) {
            throw new Error(`Superior agent with ID ${reportingAgent.superiorID} not found.`);
        }

        // Resolve the original order call
        if (directory.pendingOrders.has(originalOrderSequenceID)) {
            const pendingOrder = directory.pendingOrders.get(originalOrderSequenceID);
            pendingOrder.resolve({
                callID: pendingOrder.call.id,
                status: "SUCCESS",
                details: `Report for order ${originalOrderSequenceID} from agent ${agentID}: ${reportString}`
            });
            directory.pendingOrders.delete(originalOrderSequenceID);
            console.log(`%c[System] [SCD] Resolved pending order with sequence ID: ${originalOrderSequenceID}`, "background-color: #90EE90;");
        } else {
            console.warn(`%c[System] [SCD] Received report for non-pending or already resolved order sequence ID: ${originalOrderSequenceID}`, "color: orange;");
        }

        // A report call does not need a result sent back to the caller.
        // The "result" is the resolution of the superior's original ORDER call.
        return null;
    }

    static executeGenerateCall(directory, parsedCall, agentID) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`%c[System] [SCD] Executing Generate call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
                const { promptString } = parsedCall.payload;

                // Create a disposable agent for the generation task.
                // This agent is not added to the main directory.
                const disposableAgent = {
                    identifier: `disposable-${Date.now()}`,
                    rank: Standards.agentRanks.ATTENDANT,
                    callSign: "Disposable",
                    title: "Disposable Generation Agent",
                    status: "Idle",
                    unresolvedCalls: [],
                    team: Standards.agentTeams.HEARTS,
                    chatHistory: [],
                    // A minimal system prompt for a one-off generation.
                    customSystemInstructions: "You are a helpful assistant. Respond to the user's prompt directly and concisely.",
                };

                const response = await Awakening.awakenAgent(directory, disposableAgent, promptString, true);

                resolve({
                    callID: parsedCall.id,
                    status: "SUCCESS",
                    details: "Generation successful.",
                    generatedContent: response
                });

            } catch (error) {
                console.error(`%c[System] [SCD] Failed to execute Generate call ${parsedCall.id}. Error: ${error.message}`, "color: red;");
                reject(error);
            }
        });
    }

    static executeClarifyCall(directory, parsedCall, agentID) {
        return new Promise((resolve, reject) => {
            console.log(`%c[System] [SCD] Executing Clarify call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");

            const agent = directory.agents.get(agentID);
            if (agent.rank !== Standards.agentRanks.CHIEF && agent.rank !== Standards.agentRanks.WISH_CHIEF) {
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
                directory.addClarification(parsedCall.payload.questions, responses);
                console.log(`%c[System] [SCD] Clarification recorded. Questions:`, "background-color: #90EE90;", parsedCall.payload.questions);
                console.log(`%c[System] [SCD] Clarification recorded. Responses:`, "background-color: #90EE90;", responses);
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
        return new Promise(async (resolve, reject) => {
            console.log(`%c[System] [SCD] Executing Phase call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");

            const { justification, depString } = parsedCall.payload;

            // Partagaz D Internal Review
            console.log(`%c[System] [SCD] Phase shift request from Chief. Forwarding to Partagaz D for internal review...`, "background-color: #ADD8E6;");

            const teams = [Standards.agentTeams.HEARTS, Standards.agentTeams.DIAMONDS, Standards.agentTeams.CLUBS];
            const reviewAgents = [];
            for (const team of teams) {
                // use the new rank and a Gate 1 title/call-sign
                const agentId = directory.recruitNewAgent(
                    `Partagaz 1-${team.name[0]}`,
                    'Gate 1 Analyst',
                    Standards.agentRanks.PARTAGAZ_1, // <-- switch from PARTAGAZ_D
                    null,
                    [],
                    team
                );
                reviewAgents.push(directory.agents.get(agentId));
            }

            // Construct Clarification History for the prompt
            let clarificationText = "";
            if (directory.clarificationHistory.length > 0) {
                clarificationText = "---BEGIN USER CLARIFICATION HISTORY---\n";
                directory.clarificationHistory.forEach(({ questions, responses }) => {
                    questions.forEach((q, i) => {
                        clarificationText += `Question: ${q}\nResponse: ${responses[i] ?? ""}\n\n`;
                    });
                });
                clarificationText += "---END USER CLARIFICATION HISTORY---";
            }

            const reviewPrompt = `A new Deterministically Executable Plan (DEP) has been submitted for review. Please analyze the following DEP and respond with only "APPROVE" if you approve it, or "DENY" followed by your reasoning if you deny it.\n\n${clarificationText ? clarificationText + '\n\n' : ''}---BEGIN DEP---\n${depString}\n---END DEP---`;

            const reviewPromises = reviewAgents.map(agent => Awakening.awakenAgent(directory, agent, reviewPrompt, true));
            const reviewResults = await Promise.all(reviewPromises);

            const denials = reviewResults.filter(res => res.toUpperCase().startsWith('DENY'));

            if (denials.length > 0) {
                console.warn(`%c[System] [SCD] Phase shift denied by Partagaz D internal review.`, "color: orange;");
                const denialReasons = denials.join('\n');
                resolve({
                    callID: parsedCall.id,
                    status: "DENIED_BY_INTERNAL_REVIEW",
                    details: `Phase shift was denied by internal review. Feedback from Partagaz D:\n${denialReasons}`
                });
                return;
            }

            console.log(`%c[System] [SCD] Partagaz D review passed unanimously. Proceeding to user for final approval.`, "background-color: #90EE90;");

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

    static executeStoreCall(directory, parsedCall, agentID) {
        return new Promise(async (resolve) => {
            console.log(`%c[System] [SCD] Executing Store call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
            const { storageString } = parsedCall.payload;

            // Partagaz F Internal Review
            console.log(`%c[System] [SCD] Store request from agent ${agentID}. Forwarding to Partagaz F for internal review...`, "background-color: #ADD8E6;");

            const teams = [Standards.agentTeams.HEARTS, Standards.agentTeams.DIAMONDS, Standards.agentTeams.CLUBS];
            const reviewAgents = [];
            for (const team of teams) {
                const agentId = directory.recruitNewAgent(`Partagaz F-${team.name[0]}`, 'File Analyst', Standards.agentRanks.PARTAGAZ_F, null, [], team);
                reviewAgents.push(directory.agents.get(agentId));
            }

            // Construct Clarification History for the prompt
            let clarificationText = "";
            if (directory.clarificationHistory.length > 0) {
                clarificationText = "---BEGIN USER CLARIFICATION HISTORY---\n";
                directory.clarificationHistory.forEach(({ questions, responses }) => {
                    questions.forEach((q, i) => {
                        clarificationText += `Question: ${q}\nResponse: ${responses[i] ?? ""}\n\n`;
                    });
                });
                clarificationText += "---END USER CLARIFICATION HISTORY---";
            }

            const reviewPrompt = `A new file has been submitted for storage in the Company File System. Please analyze the following file content and respond with only "APPROVE" if you approve it, or "DENY" followed by your reasoning if you deny it.\n\n${clarificationText ? clarificationText + '\n\n' : ''}---BEGIN FILE CONTENT---\n${storageString}\n---END FILE CONTENT---`;

            const reviewPromises = reviewAgents.map(agent => Awakening.awakenAgent(directory, agent, reviewPrompt, true));
            const reviewResults = await Promise.all(reviewPromises);

            const denials = reviewResults.filter(res => res.toUpperCase().startsWith('DENY'));

            if (denials.length > 0) {
                console.warn(`%c[System] [SCD] File storage denied by Partagaz F internal review.`, "color: orange;");
                const denialReasons = denials.join('\n');
                resolve({
                    callID: parsedCall.id,
                    status: "DENIED_BY_INTERNAL_REVIEW",
                    details: `File storage was denied by internal review. Feedback from Partagaz F:\n${denialReasons}`
                });
                return;
            }

            console.log(`%c[System] [SCD] Partagaz F review passed unanimously. Storing document.`, "background-color: #90EE90;");

            const storageID = directory.storeDocument(storageString);

            console.log(`%c[System] [SCD] Document stored with ID: ${storageID}`, "background-color: #90EE90;");

            resolve({
                callID: parsedCall.id,
                status: "SUCCESS",
                details: `Document successfully stored. Your unique storage ID is: ${storageID}`
            });
        });
    }

    static executeRetrieveCall(directory, parsedCall, agentID) {
        return new Promise((resolve) => {
            console.log(`%c[System] [SCD] Executing Retrieve call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
            const { retrievalString } = parsedCall.payload;

            const documentContent = directory.retrieveDocument(retrievalString);

            if (documentContent) {
                console.log(`%c[System] [SCD] Document ${retrievalString} retrieved successfully.`, "background-color: #90EE90;");
                const forgettableContent = `$$$${retrievalString}$$$${documentContent}$$$${retrievalString}$$$`;
                resolve({
                    callID: parsedCall.id,
                    status: "SUCCESS",
                    details: `Document ${retrievalString} retrieved. Content is included in this response.`,
                    retrievedContent: forgettableContent
                });
            } else {
                console.warn(`%c[System] [SCD] Document with ID ${retrievalString} not found.`, "color: orange;");
                resolve({
                    callID: parsedCall.id,
                    status: "NOT_FOUND",
                    details: `Document with ID ${retrievalString} could not be found in the Company File System.`
                });
            }
        });
    }

    static executeForgetCall(directory, parsedCall, agentID) {
        return new Promise((resolve) => {
            console.log(`%c[System] [SCD] Executing Forget call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
            const { forgetString } = parsedCall.payload;

            // The actual forgetting happens after all calls are processed.
            // Here, we just acknowledge the call.
            resolve({
                callID: parsedCall.id,
                status: "SUCCESS",
                details: `Content associated with ID ${forgetString} will be forgotten from context.`
            });
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

            const { justification, title, customSystemInstructions } = parsedCall.payload;

            const newAgentDetails = {
                callSign: newAgentCallSign,
                title: title,
                rank: newAgentRank,
                team: newAgentTeam,
                customSystemInstructions: customSystemInstructions
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
                        newAgentDetails.team,
                        newAgentDetails.customSystemInstructions
                    );
                    console.log(`%c[System] [SCD] Successfully recruited new agent with ID: ${newAgentID}. Details: Call Sign: ${newAgentDetails.callSign}, Title: "${newAgentDetails.title}", Rank: ${newAgentDetails.rank.name}, Team: ${newAgentDetails.team.name}, Superior ID: ${agentID}`, "background-color: #90EE90;");

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

    static executeCommandCall(directory, parsedCall, agentID) {
        return new Promise(async (resolve, reject) => {
            console.log(`%c[System] [SCD] Executing Command call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");
            const { justification, commandString } = parsedCall.payload;

            // Partagaz C Internal Review
            console.log(`%c[System] [SCD] Command call from Chief. Forwarding to Partagaz C for internal review...`, "background-color: #ADD8E6;");

            const teams = [Standards.agentTeams.HEARTS, Standards.agentTeams.DIAMONDS, Standards.agentTeams.CLUBS];
            const reviewAgents = [];
            for (const team of teams) {
                const agentId = directory.recruitNewAgent(`Partagaz C-${team.name[0]}`, 'Command Analyst', Standards.agentRanks.PARTAGAZ_C, null, [], team);
                reviewAgents.push(directory.agents.get(agentId));
            }

            // Construct Clarification History for the prompt
            let clarificationText = "";
            if (directory.clarificationHistory.length > 0) {
                clarificationText = "---BEGIN USER CLARIFICATION HISTORY---\n";
                directory.clarificationHistory.forEach(({ questions, responses }) => {
                    questions.forEach((q, i) => {
                        clarificationText += `Question: ${q}\nResponse: ${responses[i] ?? ""}\n\n`;
                    });
                });
                clarificationText += "---END USER CLARIFICATION HISTORY---";
            }

            const reviewPrompt = `A new AWS CLI command has been submitted for review. Please analyze the following command and its justification, then respond with only "APPROVE" if you approve it, or "DENY" followed by your reasoning if you deny it.\n\n${clarificationText ? clarificationText + '\n\n' : ''}---BEGIN COMMAND---\n${commandString}\n---END COMMAND---\n\n---BEGIN JUSTIFICATION---\n${justification}\n---END JUSTIFICATION---`;

            const reviewPromises = reviewAgents.map(agent => Awakening.awakenAgent(directory, agent, reviewPrompt, true));
            const reviewResults = await Promise.all(reviewPromises);

            const denials = reviewResults.filter(res => res.toUpperCase().startsWith('DENY'));

            if (denials.length > 0) {
                console.warn(`%c[System] [SCD] Command call denied by Partagaz C internal review.`, "color: orange;");
                const denialReasons = denials.join('\n');
                resolve({
                    callID: parsedCall.id,
                    status: "DENIED_BY_INTERNAL_REVIEW",
                    details: `Command call was denied by internal review. Feedback from Partagaz C:\n${denialReasons}`
                });
                return;
            }

            console.log(`%c[System] [SCD] Partagaz C review passed unanimously. Proceeding to user for final approval.`, "background-color: #90EE90;");

            const container = document.createElement('div');
            document.body.appendChild(container);
            const root = ReactDOM.createRoot(container);

            const cleanup = () => {
                root.unmount();
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
            };

            const handleConfirm = async () => {
                cleanup();
                try {
                    const res = await fetch('/api/executeCommand', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: commandString }),
                    });

                    const result = await res.json();

                    if (!res.ok) {
                        throw new Error(result.error || 'Failed to execute command.');
                    }

                    resolve({
                        callID: parsedCall.id,
                        status: "SUCCESS",
                        details: `Command executed successfully. Output: ${result.output}`
                    });
                } catch (error) {
                    console.error(`%c[System] [SCD] Command execution failed: ${error.message}`, "color: red;");
                    reject(new Error(`Command execution failed: ${error.message}`));
                }
            };

            const handleCancel = () => {
                cleanup();
                console.warn(`%c[System] [SCD] Command execution denied by user.`, "color: orange;");
                resolve({
                    callID: parsedCall.id,
                    status: "DENIED",
                    details: "Command execution was denied by the user."
                });
            };

            const formElement = React.createElement(CommandForm, {
                justification,
                commandString,
                onConfirm: handleConfirm,
                onCancel: handleCancel,
            });

            root.render(formElement);
        });
    }
}

// Class Export
export {Standards, Operations, ClarificationForm};
