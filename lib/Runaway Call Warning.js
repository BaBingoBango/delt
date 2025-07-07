//
//  Runaway Call Warning.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

export const runawayCallWarningMessage = `
Hello Agent!

This message is to inform you that you have issued a system call while you already have at least one unresolved system call in progress.

In order to ensure the system runs smoothly and to prevent agent runaway, no agent is permitted to issue a new system call while they have an existing one in progress. Once you have received the results for all of your currently resolving calls, this hold will be lifted and you will be able to issue new calls once more.

Thank you!
`;
