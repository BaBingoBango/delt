//
//  executeCommand.js
//  doubleact
//
//  Copyright © 2025 Chorale LLC
//

import { exec } from 'child_process';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const { command } = req.body;

    if (!command || typeof command !== 'string') {
        return res.status(400).json({ error: 'Command must be a non-empty string.' });
    }

    // Security: Basic validation to ensure it's an AWS CLI command
    if (!command.trim().startsWith('aws ')) {
        return res.status(400).json({ error: 'Invalid command. Only "aws" commands are allowed.' });
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[executeCommand] Execution error: ${error.message}`);
            return res.status(500).json({ error: stderr || error.message });
        }
        if (stderr) {
            console.warn(`[executeCommand] Stderr: ${stderr}`);
        }
        res.status(200).json({ output: stdout });
    });
}
