//
//  DSP.js
//  doubleact
//
//  Copyright © 2025 Chorale LLC
//

import { Standards } from "@/SCD";

class Templates {
    static async getSystemPrompt(rank, team, customInstructions = "") {
        console.log(`%c[System] [DSP] Generating system prompt for rank and team: ${rank.name}, ${team.name}`, "background-color: #CBC3E3;");

        // Ensure rank and team are valid
        const validTeams = Object.values(Standards.agentTeams);
        const validRanks = Object.values(Standards.agentRanks);
        if (!validRanks.includes(rank) || !validTeams.includes(team)) {
            throw new Error("Invalid rank or team specified.");
        }
        console.log("%c[System] [DSP] Valid rank and team specified.", "background-color: #CBC3E3;");

        try {
            const readPromptFile = async (fileName) => {
                const fileUrl = `/delt-docs/delt-docs/delt_docs.docc/${fileName}.md`;
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${fileUrl}. Status: ${response.status}`);
                }
                const fileContent = await response.text();
                const lines = fileContent.split('\n');
                return lines.slice(1).join('\n').trim();
            };

            let finalPrompt;

            // Check for Partagaz ranks, which have their own unique prompts
            if (rank.name === Standards.agentRanks.PARTAGAZ_C.name || rank.name === Standards.agentRanks.PARTAGAZ_D.name || rank.name === Standards.agentRanks.PARTAGAZ_F.name) {
                const partagazPrompt = await readPromptFile(rank.name);
                console.log(`%c[System] [DSP] Successfully generated Partagaz system prompt for ${rank.name}.`, "background-color: #CBC3E3;");
                finalPrompt = partagazPrompt;
            } else {
                // Fetch both the rank and team prompt files asynchronously
                const [allAgentsPrompt, rankPrompt, teamPrompt] = await Promise.all([
                    readPromptFile("All Agents"),
                    readPromptFile(rank.name),
                    readPromptFile(team.name)
                ]);
                finalPrompt = `${allAgentsPrompt}\n\n${rankPrompt}\n\n${teamPrompt}`;
            }

            // Append custom instructions if they exist
            if (customInstructions) {
                finalPrompt += `\n\n---ADDITIONAL INSTRUCTIONS FROM YOUR SUPERIOR---\n${customInstructions}`;
            }

            console.log("%c[System] [DSP] Successfully generated system prompt.", "background-color: #CBC3E3;");
            console.debug("%c[System] [DSP] Final prompt content:", "background-color: #CBC3E3;", finalPrompt);
            return finalPrompt;

        } catch (error) {
            console.error("[System] [DSP] Error fetching prompt files:", error);
            return this.getEmergencyPrompt();
        }
    }

    static getEmergencyPrompt() {
        console.log("%c[System] [DSP] Using emergency prompt due to file read error.", "background-color: #CBC3E3;");
        return `TODO: EMERGENCY PROMPT NOTICE: You are an agent of the user. There has been a catastrophic system failure. Your primary role is to assist the user in their tasks. Please acknowledge this emergency and follow the user's instructions. Do not attempt to access any system files or resources that are not explicitly provided by the user. Your actions are limited to the information and tools available to you at this moment.`;
    }
}

// Class Export
export { Templates };
