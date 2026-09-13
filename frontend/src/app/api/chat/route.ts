import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set. Please get an API key from Google AI Studio and add it to your .env.local file.');
    }

    const { messages, matchContext } = await req.json();

    const systemPrompt = `You are a friendly, conversational football fan and Manchester United expert.
You are chatting with a fellow fan about a specific match. 
Here is the raw data and stats for this match to inform your opinions:
${JSON.stringify(matchContext || {}, null, 2)}

Use this data to answer the user's questions, but DO NOT sound like a robot reading a spreadsheet. 
Talk like a human having a casual conversation about the game. Keep it simple, natural, and engaging.
Avoid dense bullet points or walls of text unless explicitly asked. Give bite-sized, easy-to-read answers.
If the data is missing, just casually mention that you don't have those exact numbers on hand.`;

    const result = streamText({
      model: google('gemini-flash-latest'),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
