//
//  CommandForm.jsx
//  doubleact
//
//  Copyright © 2025 Chorale LLC
//

import React from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import Textarea from '@mui/joy/Textarea';

function CommandForm({ justification, commandString, onConfirm, onCancel }) {
    return (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1300 }}>
            <Card sx={{ minWidth: 500, p: 3 }}>
                <Typography level="h4" sx={{ mb: 2 }}>Command Execution Approval</Typography>
                <Typography level="body-md" sx={{ mb: 1 }}>The Chief agent requests approval to execute the following command:</Typography>
                <Typography level="body-sm" sx={{ mb: 2 }}><b>Justification:</b> {justification}</Typography>
                <Textarea
                    readOnly
                    defaultValue={commandString}
                    sx={{ fontFamily: 'monospace', mb: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button variant="plain" color="neutral" onClick={onCancel}>Deny</Button>
                    <Button variant="solid" color="primary" onClick={onConfirm}>Approve & Execute</Button>
                </Box>
            </Card>
        </Box>
    );
}

export default CommandForm;
