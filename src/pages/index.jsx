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
import {standardInitialMessage} from "../../lib/SIM";

export default function HomePageView() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const sendPrompt = async (promptToSend) => {
    if (!promptToSend.trim()) return;
    setMessages(prev => [...prev, { user: promptToSend, carol: 'Thinking...' }]);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptToSend }),
    });
    const { reply } = await res.json();
    setMessages(prev => prev.map((msg, index) =>
      index === prev.length - 1 ? { ...msg, carol: reply } : msg
    ));
    setInput('');
  };

  useEffect(() => {
      console.log("%c[System] Welcome to delt!", "background-color: #CBC3E3;");
      console.log("%c[System] Hiring Agent Delta (rank: Chief) (title: Chief of Staff to the User)...", "background-color: #CBC3E3;");
      sendPrompt(standardInitialMessage).then(() => {});
      console.log("%c[System] SIM system message delivered to Chief.", "background-color: #CBC3E3;");
  }, []);

  const handleSendClick = () => {
    sendPrompt(input).then(_ => {});
  };

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
      </Box>
  );
}
