//
//  SCD.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

class Standards {
    static systemMessageTypes = {
        SIM: "Standard Initial Message",
    }

    static systemCallTypes = {
        CLARIFY: {
            name: "Clarify",
            description: "Request clarification from the user. Requires approval from the Chief-rank agent.",
            arguments: ["callerID", "reasoning"]
        },
        RECRUIT: {
            name: "Recruit",
            description: "Request to recruit a new subordinate agent. Requires approval from all superiors, including the user. Exception: Chief-rank agent can have up to two Director-rank agents without approval.",
            arguments: ["callerID", "reasoning"]
        }
    }
}
