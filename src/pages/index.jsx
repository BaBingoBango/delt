//
//  index.jsx
//  doubleact
//
//  Copyright © 2025 Chorale LLC
//

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import Head from 'next/head';
import { Directory } from "@/MDS";
import { Operations, Standards } from "@/SCD";
import ClarificationForm from "@/ClarificationForm";
import List from '@mui/joy/List';
import ListItemContent from '@mui/joy/ListItemContent';
import CircularProgress from '@mui/joy/CircularProgress';
import Chip from '@mui/joy/Chip';

const getTeamEmoji = (teamName) => {
    const teamMap = {
        'Hearts': '♥️',
        'Diamonds': '♦️',
        'Clubs': '♣️',
        'Spades': '♠️',
    };
    return teamMap[teamName] || teamName;
};

function AgentCard({ agent }) {
    const getStatusChip = (status) => {
        switch (status) {
            case 'Generating...':
                return (
                    <Chip
                        variant="soft"
                        color="warning"
                        startDecorator={<CircularProgress size="sm" color="warning" />}
                    >
                        Generating...
                    </Chip>
                );
            case 'Idle':
                return <Chip variant="soft" color="success">Idle</Chip>;
            default:
                return <Chip variant="soft" color="neutral">{status}</Chip>;
        }
    };

    return (
        <Card
            variant="outlined"
            sx={{
                mb: 1,
                borderColor: 'danger.500',
                boxShadow: '0 0 8px rgba(255, 0, 0, 0.15)',
                fontFamily: 'monospace',
            }}
        >
            <ListItemContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography level="title-md" sx={{ color: 'danger.500', textTransform: 'uppercase' }}>
                            {agent.callSign} :: {agent.rank.name} :: TEAM {getTeamEmoji(agent.team.name)}
                        </Typography>
                        <Typography level="body-sm" sx={{ fontStyle: 'italic', color: 'neutral.700' }}>
                            {agent.title}
                        </Typography>
                        <Box sx={{ mt: 1, fontSize: 'body-xs' }}>
                            <Typography textColor="neutral.600">ID: <Typography component="span" textColor="text.primary">{agent.identifier}</Typography></Typography>
                            {agent.superiorID && <Typography textColor="neutral.600">SUPERIOR: <Typography component="span" textColor="text.primary">{agent.superiorID}</Typography></Typography>}
                        </Box>
                    </Box>
                    {getStatusChip(agent.status)}
                </Box>
            </ListItemContent>
        </Card>
    );
}

function formatElapsedTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export default function HomePageView() {
    const [hasCreatedProject, setHasCreatedProject] = useState(false);
    const [agents, setAgents] = useState([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const directoryRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        console.log("%c[System] [UJS] Hi there! Welcome to Double Act! 👋", "background-color: #CBC3E3;");
        console.log("%c[System] [UJS] (Debug) System call spec:", "background-color: #CBC3E3;");
        console.log(JSON.stringify(Standards.systemCallTypes, null, 2));
    }, []);

    useEffect(() => {
        if (hasCreatedProject) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [hasCreatedProject]);

    const getUserInitialInput = (directory) => {
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

            const handleConfirm = (responses) => {
                cleanup();
                const questions = [
                    "Welcome to Double Act AI! Tell us a little about yourself. Who are you and what do you do? Are you a computer expert or are you new to software?",
                    "What are your goals for this project? What led you to pursue this? Where did the idea come from?",
                    "What are specific requirements you have in mind? What is your vision for the completed product?",
                    "What else should we know about you or your project? Any other context or details you want to share? The system will follow-up with questions automatically when needed."
                ];

                // Debug - set canned responses
                const defaultIntroAnswers = [
                    "Hello! My name is Dave, I live in the Pleasant Oaks subdivision in Michigan and am the HOA president. I am a retired bank manager and have very little technical experience. I would love a website for our HOA.",
                    "My goals are to create an HOA website that allows easy access to information relevant to current and potential residents. I saw similar HOA sites online and was inspired.",
                    "The pages I would like are Contact Us, Legal Docs, Schools, Dues, Annual Meetings, and News & Events. Dues, Annual Meetings, and News & Events should require sign-in and should be resident only. I envision a simple website that is used for information access.",
                    "Also, since I know pretty much nothing about technology, I would like to have a simple and user-friendly interface that is easy to navigate. I would also like to have a contact form for residents to reach out with questions or concerns. Since I am unskilled with technology, the blog/updates section should be easy to update without needing to know any coding or anything like that.",
                ];

                // Normalize to an array
                const normalized = Array.isArray(responses)
                    ? responses
                    : responses == null
                        ? []
                        : [responses];

                // Fill blanks with defaults and coerce to string safely
                responses = defaultIntroAnswers.map((def, index) => {
                    const val = normalized[index];
                    const s = typeof val === "string" ? val : val != null ? String(val) : "";
                    return s.trim() === "" ? def : s;
                });

                directory.addClarification(questions, responses);
                console.log("%c[System] [SIMS] Initial user input captured.", "background-color: #CBC3E3;");
                resolve(responses);
            };

            const handleCancel = () => {
                cleanup();
                console.warn(`%c[System] [SIMS] Project creation cancelled by user.`, "color: orange;");
                setHasCreatedProject(false); // Revert project creation state
                reject(new Error("Project creation cancelled by user."));
            };

            const questions = [
                "Welcome to Double Act AI! Tell us a little about yourself. Who are you and what do you do? Are you a computer expert or are you new to software?",
                "What are your goals for this project? What led you to pursue this? Where did the idea come from?",
                "What are specific requirements you have in mind? What is your vision for the completed product?",
                "What else should we know about you or your project? Any other context or details you want to share? The system will follow-up with questions automatically when needed."
            ];

            const formElement = React.createElement(ClarificationForm, {
                questions,
                options: [[], [], []], // Open-ended questions
                onConfirm: handleConfirm,
                onCancel: handleCancel,
                isInitialInput: true,
            });

            root.render(formElement);
        });
    };

    /**
     * Standard Initial Message System (SIMS) execution function.
     * This function acts as the driver for the entire project.
     */
    const executeSIMS = async () => {
        setHasCreatedProject(true);
        console.log("%c[System] [SIMS] Accessing new, empty directory...", "background-color: #CBC3E3;");

        // Start by setting up the directory for Gate 00-Wish.
        // This directory will take in the user's free-text story, goals, and prompts,
        // transforming it into a self-consistent, achievable, and scoped user wish for AI intake.
        const gate1Directory = new Directory();
        directoryRef.current = gate1Directory;
        gate1Directory.setUpdateCallback((updatedAgents) => {
            setAgents([...updatedAgents]);
        });
        gate1Directory.setAgentStatus = gate1Directory.setAgentStatus.bind(gate1Directory);

        // Start by manually issuing a user input form with hard-coded initial questions for the user.
        let initialInputs;
        try {
            initialInputs = await getUserInitialInput(gate1Directory);
            console.log("Initial user inputs:", initialInputs);
        } catch (error) {
            console.error(error.message);
            return; // Stop execution if user cancels
        }

        // Set up Gate 1's Chief agent
        const gate1ChiefID = gate1Directory.recruitNewAgent(
            Operations.randomAgentNames[Math.floor(Math.random() * Operations.randomAgentNames.length)],
            "User Wish Chief",
            Standards.agentRanks.WISH_CHIEF,
            null,
            [],
            Standards.agentTeams.HEARTS
        );

        // Send the SIM v2
        // This will begin the "working space" of the chief agent, finished by a successful approved Phase call
        await Operations.sendSystemMessage(
            directoryRef.current,
            gate1ChiefID,
            Standards.systemMessageTypes.SIM,
            "Hello Chief Agent! Initial user responses: " + JSON.stringify(initialInputs, null, 2)
        );
    };

    return (
        <Box
            sx={{
                maxWidth: 800,
                mx: 'auto',
                py: 4,
                px: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            <Head>
                <title>Double Act</title>
            </Head>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography level="h2">Version 0.2.0 (Alpha)</Typography>
                {hasCreatedProject && (
                    <Chip color="primary" variant="soft">
                        <Typography level="body-sm" sx={{ fontFamily: 'monospace' }}>
                            Elapsed Time: {formatElapsedTime(elapsedTime)}
                        </Typography>
                    </Chip>
                )}
            </Box>

            {!hasCreatedProject ? (
                <Card>
                    <Typography level="body-md" sx={{mb: 2}}>Welcome to Double Act. Click the button below to create a new project and hire the initial Chief agent.</Typography>
                    <Button onClick={executeSIMS}>Create Project</Button>
                </Card>
            ) : (
                <>
                    <Typography level="h4">Agent Roster</Typography>
                    <List>
                        {agents.map((agent) => (
                            <AgentCard key={agent.identifier} agent={agent} />
                        ))}
                    </List>
                </>
            )}
        </Box>
    );
}
