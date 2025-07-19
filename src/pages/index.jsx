//
//  index.jsx
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import Head from 'next/head';
import { Directory } from "@/MDS";
import { Operations, Standards } from "@/SCD";
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
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
        <Card variant="outlined" sx={{ mb: 1 }}>
            <ListItemContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography level="title-md">{agent.callSign} ({agent.rank.name}) {getTeamEmoji(agent.team.name)}</Typography>
                        <Typography level="body-sm">{agent.title}</Typography>
                        <Typography level="body-xs" textColor="text.tertiary">{agent.identifier}</Typography>
                        {agent.superiorID && <Typography level="body-xs" textColor="text.tertiary">Superior: {agent.superiorID}</Typography>}
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
        console.log("%c[System] [UJS] Hi there! Welcome to delt! 👋", "background-color: #CBC3E3;");
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

    const executeSIMS = async () => {
        setHasCreatedProject(true);
        console.log("%c[System] [SIMS] Accessing new, empty directory...", "background-color: #CBC3E3;");

        const directory = new Directory();
        directoryRef.current = directory;

        directory.setUpdateCallback((updatedAgents) => {
            setAgents([...updatedAgents]);
        });

        directory.setAgentStatus = directory.setAgentStatus.bind(directory);

        console.log("%c[System] [SIMS] Hiring Agent Delta (rank: Chief) (title: Chief of Staff to the User)...", "background-color: #CBC3E3;");
        const chiefAgentID = directory.recruitNewAgent(
            "Delta",
            "Chief of Staff to the User",
            Standards.agentRanks.CHIEF,
            null,
            [],
            Standards.agentTeams.DIAMONDS
        );

        console.log("%c[System] [SIMS] Sending SIM to Agent Delta...", "background-color: #CBC3E3;");
        await Operations.sendSystemMessage(directoryRef.current, chiefAgentID, Standards.systemMessageTypes.SIM);
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
                <Typography level="h2">Version 0.1.0</Typography>
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
                    <Typography level="body-md" sx={{mb: 2}}>Welcome to delt. Click the button below to create a new project and hire the initial Chief agent.</Typography>
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
