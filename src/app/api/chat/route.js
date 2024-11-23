import { streamObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyBJ7w_R-z_hm8nAkkWvN5BKjmB47P8VMcQ",
});
const schema = z.object({
  documentTitle: z.string(),
  neededdocuments: z.string(),
  eligiblity: z.string(),
  destination: z.string()
});

export async function POST(req) {
  try {
    const { message } = await req.json();

    const { partialObjectStream } = streamObject({
      model: google("gemini-1.5-flash"),
      schema: schema,
      prompt: `generate a response for the given document input "${message}".`,
      system: "You are a chatbot designed to generate output for the given document input where the document will be an india governments document and chatbot should reply with the needed document for verification and eligibility and destination to get the document.",
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const streamObj of partialObjectStream) {
          const chunk = JSON.stringify(streamObj);
          console.log('Streaming chunk:', chunk);
          controller.enqueue(new TextEncoder().encode(JSON.stringify(streamObj) + "\n"));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate song description.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
