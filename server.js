import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();

// Payload အရွယ်အစားကြီးမားသော ဖိုင်များကို လက်ခံရန်
app.use(express.json({ limit: '500mb' }));
app.use(cors());

// Gemini API Setup (apiVersion ကို v1beta ဟု သတ်မှတ်ခြင်းသည် Preview model များအတွက် ပိုမိုအဆင်ပြေစေသည်)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Universal AI Handler (Gemini 2.0/3.0 Preview Models ကို သုံးရန် ပြင်ဆင်ထားသည်)
const runAI = async (modelName, systemPrompt, userContent, isMedia = false) => {
    // အနာဂတ်တွင် ထွက်လာမည့် gemini-3-flash-preview သို့မဟုတ် gemini-2.0-flash-exp ကို ဤနေရာတွင် သုံးနိုင်သည်
    const model = genAI.getGenerativeModel(
        { model: modelName },
        { apiVersion: 'v1beta' }
    );

    const contents = isMedia ? userContent : [{ parts: [{ text: userContent }] }];
    
    const result = await model.generateContent({
        contents,
        systemInstruction: systemPrompt,
    });
    
    return result.response.text();
};

// --- API ENDPOINTS ---

// 1. Transcribe & Video Recap (Multimedia Tools)
app.post('/api/media-process', async (req, res) => {
    try {
        const { media, mimeType, task } = req.body;
        const prompt = task === 'transcribe' 
            ? "Transcribe word-for-word accurately and provide speaker labels if possible." 
            : "Provide a high-quality cinematic recap of this media. Focus on key moments and emotional tone.";
        
        // Gemini-3-flash-preview ထွက်လာလျှင် ဤနေရာတွင် နာမည်ပြောင်းရုံရုံပင်
        const result = await runAI("gemini-2.0-flash-exp", prompt, [
            { 
                parts: [
                    { inlineData: { data: media, mimeType } }, 
                    { text: "Analyze and process this file according to the instructions." }
                ] 
            }
        ], true);
        
        res.json({ result });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: e.message }); 
    }
});

// 2. Translation & SRT (Text Tools)
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLang, type } = req.body;
        const prompt = `You are a professional translator. Translate this ${type} to ${targetLang}. 
        Use natural conversational Burmese. Avoid formal endings like 'သည်', '၏' or 'ပါဝင်ပါသည်'. 
        Maintain the original structure and emotional weight.`;
        
        const result = await runAI("gemini-2.0-flash-exp", prompt, text);
        res.json({ result });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

// 3. Creative Tools (Story, Script & Content)
app.post('/api/create', async (req, res) => {
    try {
        const { topic, type, lang } = req.body;
        let prompt = "";
        
        if (type === 'novel') {
            prompt = `Write a deep, engaging 300,000+ character style story about ${topic} in ${lang}. Focus on vivid descriptions and world-building.`;
        } else if (type === 'social_content') {
            prompt = `Write a viral video script and social media post about ${topic} in ${lang}. Include hooks and trending styles.`;
        } else {
            prompt = `Write a professional ${type} about ${topic} in ${lang}. Be extremely detailed and creative.`;
        }

        const result = await runAI("gemini-2.0-flash-exp", prompt, topic);
        res.json({ result });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

// 4. AI Voice & Subtitle Generator Logic (Optional/Text-based)
app.post('/api/sub-gen', async (req, res) => {
    try {
        const { text } = req.body;
        const prompt = "Generate a perfectly timed SRT format content from the given input. Strictly follow SRT rules.";
        const result = await runAI("gemini-2.0-flash-exp", prompt, text);
        res.json({ result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Health Check
app.get('/', (req, res) => res.send("Master Server is Live and Running!"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Master Server Online on ${PORT}`));
