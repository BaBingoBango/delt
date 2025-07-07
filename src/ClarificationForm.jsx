//
//  ClarificationForm.js
//  delt
//
//  Copyright © 2025 Chorale LLC
//

import React, { useState } from 'react';
import {
    Modal,
    ModalDialog,
    DialogTitle,
    DialogContent,
    Stack,
    FormControl,
    FormLabel,
    Input,
    Select,
    Option,
    Button,
    FormHelperText
} from '@mui/joy';

export default function ClarificationForm({ questions, options, onConfirm, onCancel }) {
    const [responses, setResponses] = useState({});

    const handleInputChange = (question, value) => {
        setResponses(prev => ({ ...prev, [question]: value }));
    };

    const handleSubmit = () => {
        onConfirm(responses);
    };

    return (
        <Modal open onClose={onCancel}>
            <ModalDialog>
                <DialogTitle>Clarification Required</DialogTitle>
                <DialogContent>Please answer the following questions to proceed.</DialogContent>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmit();
                    }}
                >
                    <Stack spacing={2}>
                        {questions.map((question, index) => (
                            <FormControl key={question}>
                                <FormLabel>{question}</FormLabel>
                                {options && options[index] && options[index].length > 0 ? (
                                    <Select
                                        placeholder="Select an option..."
                                        onChange={(e, newValue) => handleInputChange(question, newValue)}
                                        required
                                    >
                                        {options[index].map(opt => (
                                            <Option key={opt} value={opt}>{opt}</Option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="Your answer..."
                                        onChange={(e) => handleInputChange(question, e.target.value)}
                                        required
                                    />
                                )}
                            </FormControl>
                        ))}
                        <Button type="submit">Confirm</Button>
                    </Stack>
                </form>
            </ModalDialog>
        </Modal>
    );
}

