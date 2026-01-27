'use client';

import { useState } from 'react';
import { useGenerateQuestionList } from '@/hooks/useGenerateQuestionList';
import { InterviewSimulator } from './InterviewSimulator';
import { Question } from '@/types/Interviews';
import { ResumeUpload } from '@/components/ResumeUpload';
import useLocalStorage from '@/hooks/useLocalStorage';

interface ErrorResponse {
  error: string;
  message: string;
  missingFields?: string[];
  suggestion?: string;
  flaggedContent?: string[];
}

export default function InterviewPractice() {
  const [jobDescription, setJobDescription] = useState('');
  const [companyProfile, setCompanyProfile] = useState('');
  const [resume, setResume] = useLocalStorage('resume', '');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const { fetchQuestionList, isLoading, questions } = useGenerateQuestionList();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<ErrorResponse | null>(null);

  const handleGenerateQuestions = async () => {
    setValidationError(null);
    setErrorMessage(null);

    if (!jobDescription.trim()) {
      setValidationError('Please enter a job description');
      return;
    }
    if (!companyProfile.trim()) {
      setValidationError('Please enter company information');
      return;
    }
    if (!resume.trim()) {
      setValidationError('Please enter your resume');
      return;
    }

    try {
      fetchQuestionList(jobDescription, companyProfile, resume);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage({
          error: error.name,
          message: error.message,
        });
      }
    }
  };

  return interviewStarted ? (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <div className="text-primary px-4 lg:px-10 py-4">
        <div className="font-tenon">
          <div
            className="cursor-pointer"
            onClick={() => setInterviewStarted(false)}
          >
            ← back
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <InterviewSimulator
          questions={questions.filter(
            (q: Partial<Question> | undefined): q is Question => q !== undefined && typeof q?.text === 'string'
          )}
        />
      </div>
    </div>
  ) : (
    <div className="min-h-[calc(100vh-theme(spacing.16))] text-primary px-4 lg:px-10 py-8">
      <div className="lg:w-2/3 text-primary ">
        <div className="mb-4 font-tenon">
          The purpose of this page is to simulate an interview session in order
          to practice for a first round interview for a tech industry job.
        </div>
      </div>
      <div>
        <div>
          <div>please paste in the job post here:</div>
          <div>
            <textarea
              className="border-primary/50 border-2 focus:border-primary focus:outline-none"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
          </div>
          <div>
            please paste in a profile of the company here, anything you can find
            will help:
          </div>
          <div>
            <textarea
              className="border-primary/50 border-2 focus:border-primary focus:outline-none"
              value={companyProfile}
              onChange={(e) => setCompanyProfile(e.target.value)}
            ></textarea>
          </div>
          <ResumeUpload value={resume} onChange={setResume} />
        </div>
      </div>
      {validationError && (
        <div className="text-red-500 mt-4">{validationError}</div>
      )}
      {errorMessage && (
        <div className="mt-4 p-4 border-2 border-red-500 rounded-md">
          <div className="text-red-500 font-bold">{errorMessage.error}</div>
          <div className="mt-2">{errorMessage.message}</div>
          {errorMessage.suggestion && (
            <div className="mt-2 text-gray-600">{errorMessage.suggestion}</div>
          )}
          {errorMessage.missingFields && (
            <div className="mt-2">
              Missing fields: {errorMessage.missingFields.join(', ')}
            </div>
          )}
          {errorMessage.flaggedContent && (
            <div className="mt-2">
              Flagged content in: {errorMessage.flaggedContent.join(', ')}
            </div>
          )}
        </div>
      )}
      <div
        className={`border-2 border-primary text-primary mt-4 p-2 w-fit 
          ${
            isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:bg-primary hover:text-white transition-colors'
          }`}
        onClick={handleGenerateQuestions}
      >
        {isLoading ? 'Generating Questions...' : 'Generate Questions'}
      </div>
      {questions.length > 0 && (
        <div>
          <ol className="list-decimal pl-4 mt-4">
            {questions.map((question: Partial<Question> | undefined) => {
              if (!question?.text) return null;
              return (
                <li key={question.text} className="mb-2">
                  {question.text}
                </li>
              );
            })}
          </ol>

          <div className="flex gap-4">
            <div
              className="border-2 border-primary text-primary mt-8 p-2 w-fit cursor-pointer hover:bg-primary hover:text-white transition-colors"
              onClick={() => setInterviewStarted(true)}
            >
              Launch Interview
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
