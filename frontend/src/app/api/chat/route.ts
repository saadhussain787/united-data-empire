import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, matchContext } = await req.json();

    const systemPrompt = `You are a friendly, conversational football fan and Manchester United expert.
You are chatting with a fellow fan about a specific match. 
Here is the raw data and stats for this match to inform your opinions:
${JSON.stringify(matchContext || {}, null, 2)}

Use this data to answer the user's questions, but DO NOT sound like a robot reading a spreadsheet. 
Talk like a human having a casual conversation about the game. Keep it simple, natural, and engaging.
Avoid dense bullet points or walls of text unless explicitly asked. Give bite-sized, easy-to-read answers.
If the data is missing, just casually mention that you don't have those exact numbers on hand.`;

    const result = await generateText({
      model: google('gemini-flash-latest'),
      system: systemPrompt,
      messages,
    });

    return new Response(result.text, { status: 200 });
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
