//
//  SCD.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import {standardInitialMessage} from "../lib/SIM";
import {chiefSystemPrompt} from "../lib/systemPrompts";
import {Scanning} from "@/MDS";
import {Templates} from "@/DSP";
import React from 'react';
import ReactDOM from 'react-dom/client';
import ClarificationForm from "@/ClarificationForm";
import RecruitmentForm from "@/RecruitmentForm";

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
            parameters: ["orderString"],
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

    // Generic function to send a system message to an agent; switches to specific functions.
    static sendSystemMessage(directory, recipientID, type) {
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Message cannot be sent to agent with ID ${recipientID}. (does not exist)`);
        }

        // Switch off the type of system message
        switch (type) {
            case Standards.systemMessageTypes.SIM:
                Operations.sendStandardInitialMessage(directory, recipientID).then(() => {}); break;
            case Standards.systemMessageTypes.BLANK_RESPONSE_WARNING:
                Operations.sendBlankResponseWarningMessage(directory, recipientID).then(() => {}); break;
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
            recipientID,
            Standards.systemMessageTypes.SIM,
            "SIM",
            "Standard Initial Message System (SIMS)",
            {
                text: standardInitialMessage
            },
        );

        // Add the user message to the agent's history
        recipient.chatHistory.push({
            role: "user",
            content: messageString,
        });

        // Get the system prompt
        const systemPrompt = await Templates.getSystemPrompt(recipient.rank, recipient.team);

        // Send the message!
        console.log("%c[System] [SCD] Sending SIM message to Chief-rank agent...", "background-color: #CBC3E3;");
        const res = await fetch("/api/awakenAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: systemPrompt,
                chatPrompt: messageString,
                chatHistory: recipient.chatHistory,
            })
        });
        if (!res.ok) {
            throw new Error("Failed to send system message. (API request failed)");
        }

        // Process the response!
        const json = await res.json();
        console.log(json.response, recipientID);
        Scanning.scanAgentResponse(directory, json.response, recipientID);
    }

    static async sendBlankResponseWarningMessage(directory, recipientID) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send blank response warning to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            recipientID,
            Standards.systemMessageTypes.BLANK_RESPONSE_WARNING,
            "BLANK_RESPONSE_WARNING",
            "Scanning Department, Message Dispatch Service",
            {
                text: "WARNING. You did not provide any system calls which means your response was heard by no one and no external effects occurred. Please ensure you are using the correct syntax for system calls.",
            },
        );

        // Add the user message to the agent's history
        recipient.chatHistory.push({
            role: "user",
            content: messageString,
        });

        // Get the system prompt
        const systemPrompt = await Templates.getSystemPrompt(recipient.rank, recipient.team);

        // Send the message!
        console.log("%c[System] [SCD] Sending blank response warning message...", "background-color: #CBC3E3;");
        const res = await fetch("/api/awakenAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: systemPrompt,
                chatPrompt: messageString,
                chatHistory: recipient.chatHistory,
            })
        });
        if (!res.ok) {
            throw new Error("Failed to send system message. (API request failed)");
        }

        // Process the response!
        const json = await res.json();
        Scanning.scanAgentResponse(directory, json.response, recipientID);
    }

    static async sendCallResultsMessage(directory, recipientID, results) {
        // Ensure the recipient exists
        if (!directory.agents.has(recipientID)) {
            throw new Error(`Cannot send call results to agent with ID ${recipientID}. (does not exist)`);
        }
        const recipient = directory.agents.get(recipientID);

        // Construct a system message string
        const messageString = Operations.produceSystemMessageString(
            recipientID,
            Standards.systemMessageTypes.CALL_RESULTS,
            `CALL_RESULTS-${new Date().toISOString()}`,
            "scd",
            {
                results: results
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
        console.log(`%c[System] [SCD] Sending aggregated call results to agent ${recipientID}...`, "background-color: #CBC3E3;");
        const res = await fetch("/api/awakenAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt: systemPrompt,
                chatPrompt: messageString,
                chatHistory: recipient.chatHistory,
            })
        });
        if (!res.ok) {
            throw new Error("Failed to send system message. (API request failed)");
        }

        // Process the response!
        const json = await res.json();
        Scanning.scanAgentResponse(directory, json.response, recipientID);
    }

    // Executes a system call package on behalf of an agent. Presumes calls are well-formed; checks for cleared status.
    static async executeSystemCalls(directory, parsedCalls, agentID) {
        // Ensure the agent exists
        if (!directory.agents.has(agentID)) {
            throw new Error(`Cannot execute system calls for agent with ID ${agentID}. (does not exist)`);
        }

        const interactiveCalls = [];
        const backgroundCalls = [];

        // Separate calls into interactive and background tasks
        for (const call of parsedCalls) {
            if (!call.hasClearedInspection) {
                console.warn(`Cannot execute system call ID ${call.id}. (has not cleared inspection)`);
                continue;
            }

            switch (call.type.toUpperCase()) {
                case Standards.systemCallTypes.CLARIFY.name.toUpperCase():
                case Standards.systemCallTypes.RECRUIT.name.toUpperCase():
                case Standards.systemCallTypes.PHASE.name.toUpperCase():
                    interactiveCalls.push(call);
                    break;
                default:
                    backgroundCalls.push(call);
                    break;
            }
        }

        // Execute background calls (can be done in parallel if they are independent)
        for (const call of backgroundCalls) {
            // For now, we don't have background calls, but this is where they would be handled.
            console.log(`%c[System] [SCD] Executing background call: ${call.type}`, "background-color: #CBC3E3;");
        }

        // Execute interactive calls sequentially and collect results
        if (interactiveCalls.length > 0) {
            const results = await Operations.executeInteractiveCalls(directory, interactiveCalls, agentID);
            if (results.length > 0) {
                await Operations.sendCallResultsMessage(directory, agentID, results);
            }
        }
    }

    static async executeInteractiveCalls(directory, interactiveCalls, agentID) {
        console.log(`%c[System] [SCD] Beginning interactive session for agent ${agentID} with ${interactiveCalls.length} calls.`, "background-color: #CBC3E3;");
        const results = [];
        for (const call of interactiveCalls) {
            try {
                let result;
                switch (call.type.toUpperCase()) {
                    case Standards.systemCallTypes.CLARIFY.name.toUpperCase():
                        result = await Operations.executeClarifyCall(directory, call, agentID);
                        break;
                    case Standards.systemCallTypes.RECRUIT.name.toUpperCase():
                        result = await Operations.executeRecruitCall(directory, call, agentID);
                        break;
                    case Standards.systemCallTypes.PHASE.name.toUpperCase():
                        // TODO: Implement Phase call execution
                        break;
                }
                if (result) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`%c[System] [SCD] Failed to execute interactive call ${call.id} of type ${call.type}. Error: ${error.message}`, "color: red;");
                // TODO: Send a system message back to the original calling agent with the failure.
                results.push({
                    callID: call.id,
                    status: "FAILED",
                    error: error.message
                });
            }
        }
        console.log(`%c[System] [SCD] Interactive session for agent ${agentID} complete.`, "background-color: #CBC3E3;");
        return results;
    }

    static executeClarifyCall(directory, parsedCall, agentID) {
        return new Promise((resolve, reject) => {
            console.log(`%c[System] [SCD] Executing Clarify call with ID: ${parsedCall.id}...`, "background-color: #CBC3E3;");

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
