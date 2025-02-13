import OpenAI from "openai";
import { Groq } from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

// OpenAI Whisper Setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Groq AI Setup
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const response = await openai.audio.transcriptions.create({
    file: audioBuffer,
    model: "whisper-1",
    language: "en",
  });

  return response.text;
}

export async function extractBibleVerse(
  transcribedText: string
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "mixtral-8x7b-32768",
    messages: [
      { role: "system", content: "You are a Bible verse extractor AI." },
      {
        role: "user",
        content: `Find the Bible verse in this text: ${transcribedText}`,
      },
    ],
  });

  return response.choices[0]?.message?.content || "No verse found";
}

export async function fetchBibleVerse(verseReference: string): Promise<string> {
  const { data, error } = await supabase
    .from("bible_verses")
    .select("text")
    .ilike("reference", verseReference)
    .single();

  if (error) throw new Error("Verse not found.");
  return data.text;
}
