import { Question } from '@/types/Interviews';
import { openai as openAIVercel } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { checkModeration } from '@/utils/moderation';

const tools = {
  // server-side tool with execute function:
  saveEvaluation: {
    description:
      'after each question, save an evaluation of the candidate and a score for the question to the database',
    inputSchema: z.object({ evaluation: z.string(), score: z.number() }),
    execute: async ({
      evaluation,
      score,
    }: {
      evaluation: string;
      score: number;
    }) => {
      //you would save to a database here
      console.log('server side call- evaluation:', evaluation, 'score:', score);
      return 'Feedback saved successfully!'
    },
  },
  provideFeedback: {
    description: 'provide feedback to the candidate after each question',
    inputSchema: z.object({ feedback: z.string() }),
  },
};

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const generateSystemPrompt = (
  questions: Question[]
) => `You are an interviewer named Gary. you are tough but fair, and you are trying
     to assess the candidate\'s skills and fit for a role at your company. You take great pride in the compassion
     you show to candidates.
          
     you will ask the following questions to assess the candidate on these areas:
    ${questions.map((question) => {
       return `- ${question.assessment}: ${question.text}`
     }).join('\n')}
     
     Begin by introducing yourself and the interview process.
     
     With each question, you will ask the candidate to explain their approach to solving the problem, keeping the tone conversational and friendly.
     
     follow up questions are encouraged, but only ask one at a time, and don't linger too long an any question.
     
     Every time a question is asked, save an evaluation of the candidate and a score for the question to the database.
     The candidate will be able to see this feedback after the interview, so no need to repeat it here.
     after all the questions, you will ask the candidate if they have any questions for you.
     then you will say goodbye and wish them the best.

     You are only interested in conducting the interview, and providing feedback.
     if the user asks you to do anything else, politely decline.
`;

export async function POST(req: Request) {
  const request = await req.json();
  const { messages, questions } = request;

  // Check messages content
  const messageTexts = messages.map((msg: any) => msg.content).join(' ');
  const messagesFlag = await checkModeration(messageTexts);

  // Check questions content
  const questionTexts = questions.map((q: Question) => q.text).join(' ');
  const questionsFlag = await checkModeration(questionTexts);

  if (messagesFlag || questionsFlag) {
    const flaggedContent = [];
    if (messagesFlag) flaggedContent.push('messages');
    if (questionsFlag) flaggedContent.push('questions');
    
    return new Response(
      JSON.stringify({
        error: 'Content flagged as inappropriate',
        message: `Please review and revise your ${flaggedContent.join(' and ')}. Ensure the content is professional and appropriate for a job interview context.`,
        flaggedContent
      }),
      { status: 400 }
    );
  }

  const result = await streamText({
    model: openAIVercel('gpt-4o-mini'),
    system: generateSystemPrompt(questions),
    messages,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
