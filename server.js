import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(express.json({ limit: '500mb' }));
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Universal AI Handler
const runAI = async (modelName, systemPrompt, userContent, isMedia = false) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const contents = isMedia ? userContent : [{ parts: [{ text: userContent }] }];
    const result = await model.generateContent({ contents, systemInstruction: systemPrompt });
    return result.response.text();
};

// --- API ENDPOINTS ---

// 1. Transcribe & Recap
app.post('/api/media-process', async (req, res) => {
    try {
        const { media, mimeType, task } = req.body;
        const prompt = task === 'transcribe' ? "Transcribe word-for-word accurately." : "Provide a cinematic detailed recap.";
        const result = await runAI("gemini-1.5-flash", prompt, [{ parts: [{ inlineData: { data: media, mimeType } }, { text: "Process this file." }] }], true);
        res.json({ result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Translation (Text & SRT)
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLang, type } = req.body;
        const prompt = `Translate this ${type} to ${targetLang}. Conversational Burmese style. No formal endings.`;
        const result = await runAI("gemini-1.5-flash", prompt, text);
        res.json({ result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Content & Story Creator
app.post('/api/create', async (req, res) => {
    try {
        const { topic, type, lang } = req.body;
        const prompt = `Write a professional ${type} about ${topic} in ${lang}. Be very detailed.`;
        const result = await runAI("gemini-1.5-flash", prompt, topic);
        res.json({ result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Master Server Online on ${PORT}`));
