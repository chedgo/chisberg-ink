import { questionSchema, PartialQuestion } from '@/types/Interviews';
import { useCallback, useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

export function useGenerateQuestionList() {
  const { submit, isLoading, object } = useObject({
    api: '/api/question-list',
    schema: z.object({ questions: questionSchema.array() }),
  });
  const [isDoneLoading, setIsDoneLoading] = useState(false);

  const fetchQuestionList = useCallback(
    (jobPost: string, companyProfile: string, resume: string) => {
      if (!jobPost || !companyProfile || !resume) {
        return;
      }
      setIsDoneLoading(false);

      submit({
        jobPost,
        companyProfile,
        resume,
      });
      setIsDoneLoading(true);
    },
    [submit]
  );

  return {
    fetchQuestionList,
    isLoading,
    questions: object?.questions || [],
    isDoneLoading,
  };
}
