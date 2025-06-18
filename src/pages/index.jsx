//
//  index.jsx
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import { useState, useEffect } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Textarea from '@mui/joy/Textarea';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import Head from 'next/head';
import {Directory} from "@/MDS";
import {useRef} from 'react';
import {Operations, Standards} from "@/SCD";

export default function HomePageView() {

    // View Variables
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [hasCreatedProject, setHasCreatedProject] = useState(false);
    const directoryRef = useRef(new Directory());

    // View Functions
    useEffect(() => {
        console.log("%c[System] [UJS] Hi there! Welcome to delt! 👋", "background-color: #CBC3E3;");
    }, []);

    const sendPrompt = async (promptToSend) => {
        if (!promptToSend.trim()) return;
        setMessages(prev => [...prev, { user: promptToSend, carol: 'Thinking...' }]);
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptToSend }),
        });
        const { reply } = await res.json();
        setMessages(prev => prev.map((msg, idx) =>
            idx === prev.length - 1 ? { ...msg, carol: reply } : msg
        ));
        setInput('');
    };

    const executeSIMS = async () => {
        setHasCreatedProject(true);
        console.log("%c[System] [SIMS] Accessing new, empty directory...", "background-color: #CBC3E3;");
        const directory = directoryRef.current;

        console.log("%c[System] [SIMS] Hiring Agent Delta (rank: Chief) (title: Chief of Staff to the User)...", "background-color: #CBC3E3;");
        const chiefAgentID = directory.recruitNewAgent(
            "Delta", "Chief of Staff to the User", "Chief", null, []
        );

        console.log("%c[System] [SIMS] Sending SIM to Agent Delta...", "background-color: #CBC3E3;");
        Operations.sendSystemMessage(directoryRef.current, chiefAgentID, Standards.systemMessageTypes.SIM);
    };

    const handleSendClick = () => {
        sendPrompt(input).then(() => {});
    };

    // View Body
    return (
        <Box
            sx={{
                maxWidth: 600,
                mx: 'auto',
                py: 4,
                px: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            <Head>
                <title>delt</title>
            </Head>

            <Typography level="h2">delt</Typography>

            {!hasCreatedProject ? (
                <Button onClick={executeSIMS}>Create Project</Button>
            ) : (
                <>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..."
                            minRows={2}
                            sx={{ mr: 1, flexGrow: 1 }}
                        />
                        <Button onClick={handleSendClick} sx={{ ml: 'auto' }}>Send</Button>
                    </Box>

                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {messages.map((msg, idx) => (
                            <Card key={idx} variant="outlined">
                                <Typography level="body2"><strong>You:</strong> {msg.user}</Typography>
                                <Typography level="body2" sx={{ mt: 1 }}><strong>API:</strong> {msg.carol}</Typography>
                            </Card>
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
}
