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
        CLARIFICATION: {
            name: "Clarification Result",
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
            description: "Request to recruit a new subordinate agent.",
            parameters: ["justification"],
            securityPolicy: Standards.securityPolicies.RECRUITMENT
        }
    }
}

class Operations {
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

    // Executes a system call package on behalf of an agent. Presumes calls are well-formed; checks for cleared status.
    static executeSystemCalls(directory, parsedCalls, agentID) {
        // Ensure the agent exists
        if (!directory.agents.has(agentID)) {
            throw new Error(`Cannot execute system calls for agent with ID ${agentID}. (does not exist)`);
        }

        // Loop through each parsed call in message attach order (default)
        for (const eachParsedCall of parsedCalls) {
            if (!eachParsedCall.hasClearedInspection) {
                throw new Error(`Cannot execute system call ID ${eachParsedCall.id}. (has not cleared inspection)`);
            }

            // Switch off the type of system call
            switch (eachParsedCall.type.toUpperCase()) {
                case Standards.systemCallTypes.CLARIFY.name.toUpperCase():
                    Operations.executeClarifyCall(directory, eachParsedCall, agentID); break;
                case Standards.systemCallTypes.RECRUIT.name.toUpperCase():
                    Operations.executeRecruitCall(directory, eachParsedCall, agentID); break;
                default:
                    throw new Error(`Cannot execute system call of type: ${eachParsedCall.type}. (type does not exist)`);
            }
        }
    }

    static executeClarifyCall(directory, parsedCall, agentID) {
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

        const clarificationPromise = new Promise((resolve, reject) => {
            const handleConfirm = (responses) => {
                cleanup();
                resolve(responses);
            };

            const handleCancel = () => {
                cleanup();
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

        clarificationPromise.then(responses => {
            console.log("%c[System] [SCD] User provided clarification:", "background-color: #90EE90;", responses);
            // TODO: Send a system message back to the original calling agent with the user's responses.
            const responseMessage = Operations.produceSystemMessageString(
                agentID,
                Standards.systemMessageTypes.CLARIFICATION,
                parsedCall.id,
                "scd",
                {
                    responses: responses
                }
            );
            const recipient = directory.agents.get(agentID);
            // Add the user message to the agent's history
            recipient.chatHistory.push({
                role: "user",
                content: responseMessage,
            });
            Templates.getSystemPrompt(recipient.rank, recipient.team).then(systemPrompt => {
                return fetch("/api/awakenAgent", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        systemPrompt: systemPrompt,
                        chatPrompt: responseMessage,
                        chatHistory: recipient.chatHistory,
                    })
                });
            });
        }).catch(error => {
            console.warn(`%c[System] [SCD] Clarification failed: ${error.message}`, "color: orange;");
            // TODO: Send a system message back to the original calling agent with the failure.
        });
    }

    static executeRecruitCall(directory, parsedCall, agentID) {}
}

// Class Export
export {Standards, Operations};
