//
//  PhaseShiftForm.jsx
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

const PhaseShiftForm = ({ justification, depString, onConfirm, onCancel }) => {
    return (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
            <Card sx={{ width: 600, p: 3, maxHeight: '90vh', overflowY: 'auto' }}>
                <Typography level="h4" sx={{ mb: 2 }}>Phase Shift Request</Typography>
                <Typography level="body-sm" sx={{ mb: 1 }}>The Chief agent has requested to move from the **Planning** to the **Execution** phase.</Typography>

                <Typography level="body-sm" sx={{ mt: 2, mb: 1 }}>Justification:</Typography>
                <Textarea value={justification} readOnly minRows={2} sx={{ mb: 2 }} />

                <Typography level="body-sm" sx={{ mb: 1 }}>Final Deterministically Executable Plan (DEP):</Typography>
                <Textarea value={depString} readOnly minRows={10} sx={{ mb: 2, fontFamily: 'monospace' }} />

                <Typography level="body-sm" sx={{ mb: 2 }}>Do you approve this plan and wish to proceed to the Execution phase?</Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="plain" color="neutral" onClick={onCancel} sx={{ mr: 1 }}>Deny</Button>
                    <Button onClick={onConfirm}>Approve & Begin Execution</Button>
                </Box>
            </Card>
        </Box>
    );
};

export default PhaseShiftForm;

