import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { questionSchema } from '@/types/Interviews';
import { checkModeration } from '@/utils/moderation';
import { z } from 'zod';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { jobPost, companyProfile, resume } = await req.json();

  if (!jobPost || !companyProfile || !resume) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required parameters',
        message: 'Please provide all required information: job post, company profile, and resume.',
        missingFields: Object.entries({ jobPost, companyProfile, resume })
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      }),
      { status: 400 }
    );
  }

  const contentToCheck = `${jobPost} ${companyProfile} ${resume}`;
  const isContentFlagged = await checkModeration(contentToCheck);

  if (isContentFlagged) {
    return new Response(
      JSON.stringify({
        error: 'Content flagged as inappropriate',
        message: 'Please review and revise your input. Ensure all content is professional and appropriate for a job interview context. Remove any inappropriate language, personal attacks, or sensitive content.',
        suggestion: 'Consider having someone else review your content before resubmitting.'
      }),
      { status: 400 }
    );
  }

  try {
    const script = await streamObject({
      model: openai('gpt-4o-mini'),
      system: `You’re a professional job coach working with a client to prepare them for an interview.`,
      schema: z.object({ questions: questionSchema.array() }),
      prompt: `Write a list of questions that the interviewer might use to conduct the interview.
       Aim for 10 questions ranging from general cultural questions to technical questions, especially
       focusing on the skills and experience outlined in the resume and job post. here are the job post,
       company profile, and resume:
       \`\`\`${jobPost}\`\`\`
       \`\`\`${companyProfile}\`\`\`
       \`\`\`${resume}\`\`\``,
      maxOutputTokens: 500,
      // onFinish({
      //   object
      // }) {
      //   // you could save to a database here
      // },
    });
    return script.toTextStreamResponse();
  } catch (error) {
    console.error('Error generating questions:', error);
    return Response.json({ 
      error: 'Failed to get questions',
      message: 'An error occurred while generating interview questions. Please try again later or contact support if the problem persists.',
      suggestion: 'You might want to try refreshing the page or submitting your request again.'
    }, { status: 500 });
  }
}
