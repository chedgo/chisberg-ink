import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { colorStorySchema } from '@/types/ColorStory';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { color, temperature } = await req.json();

  if (!color || !temperature) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400 }
    );
  }
  //map temperature from 1-50 to 1.1-2 range
  const mappedTemperature = 1.1 + (temperature / 50) * 0.9;
  try {
    const stories = await streamObject({
      model: openai('gpt-4o-mini'),
      system: `You’re a poet with sharp wit and a knack for delivering emotionally charged short stories with an edge. Your style is modern, clever, and full of subtle sass — never shy to cut deep when needed. You avoid cliché abstractions like "love," "life," or "truth" because, frankly, they're lazy. Instead, you use concrete, vivid details that make people feel something real. Your poems are as much about what you leave unsaid as what you say. They should feel smart, a little cheeky, and punchy without being too blunt or cheesy.`,
      schema: colorStorySchema,
      prompt: `Write a story about the color ${color.name}, but make it sharp and a little rude. Follow the format, and make the references subtle yet clever. Keep it simple but smart, like you're cutting through the nonsense with a smirk. Make it clear you're not here to pander or play nice.`,
      maxOutputTokens: 200,
      temperature: mappedTemperature,
      // onFinish({
      //   object
      // }) {
      //   // you could save to a database here
      // },
    });
    return stories.toTextStreamResponse();
  } catch (error) {
    return Response.json({ error: 'Failed to get stories' }, { status: 500 });
  }
}
