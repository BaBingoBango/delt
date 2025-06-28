//
//  RecruitmentForm.jsx
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import React from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Textarea from '@mui/joy/Textarea';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemContent from '@mui/joy/ListItemContent';

const RecruitmentForm = ({ justification, newAgentDetails, onConfirm, onCancel }) => {
    return (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
            <Card sx={{ width: 450, p: 3 }}>
                <Typography level="h4" sx={{ mb: 2 }}>Recruitment Request</Typography>
                <Typography level="body-sm" sx={{ mb: 1 }}>Justification:</Typography>
                <Textarea value={justification} readOnly minRows={3} sx={{ mb: 2 }} />

                <Typography level="body-sm" sx={{ mb: 1 }}>Proposed New Agent:</Typography>
                <List variant="outlined" sx={{ borderRadius: 'sm' }}>
                    <ListItem>
                        <ListItemContent>
                            <Typography level="body-sm">Call Sign:</Typography>
                            <Typography>{newAgentDetails.callSign}</Typography>
                        </ListItemContent>
                    </ListItem>
                    <ListItem>
                        <ListItemContent>
                            <Typography level="body-sm">Title:</Typography>
                            <Typography>{newAgentDetails.title}</Typography>
                        </ListItemContent>
                    </ListItem>
                    <ListItem>
                        <ListItemContent>
                            <Typography level="body-sm">Rank:</Typography>
                            <Typography>{newAgentDetails.rank.name}</Typography>
                        </ListItemContent>
                    </ListItem>
                    <ListItem>
                        <ListItemContent>
                            <Typography level="body-sm">Team:</Typography>
                            <Typography>{newAgentDetails.team.name}</Typography>
                        </ListItemContent>
                    </ListItem>
                </List>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="plain" color="neutral" onClick={onCancel} sx={{ mr: 1 }}>Deny</Button>
                    <Button onClick={onConfirm}>Approve</Button>
                </Box>
            </Card>
        </Box>
    );
};

export default RecruitmentForm;

