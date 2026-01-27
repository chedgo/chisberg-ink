'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { UIMessage as MessageType, DefaultChatTransport } from 'ai';
import { Question } from '@/types/Interviews';
import { useAutoScroll } from '@/hooks/useAutoScroll';

interface MessageProps {
  message: MessageType;
}

// Helper to extract text content from message parts
const getMessageText = (message: MessageType): string => {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
};

// Helper to find tool invocation feedback in message parts
const getFeedbackFromParts = (message: MessageType): string | null => {
  for (const part of message.parts) {
    // Tool parts have type like 'tool-provideFeedback'
    if (part.type === 'tool-provideFeedback' && 'input' in part) {
      const input = part.input as { feedback?: string };
      if (input?.feedback) return input.feedback;
    }
  }
  return null;
};

const FeedbackMessage = ({ feedback }: { feedback: string }) => {
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);
  return feedback && !feedbackExpanded ? (
    <div className="self-end mr-8 cursor-pointer text-primary">
      <button onClick={() => setFeedbackExpanded((prev) => !prev)}>
        ✨ feedback available
      </button>
    </div>
  ) : (
    <div
      className="self-end mr-8 max-w-xl text-sm p-2 border rounded-md cursor-pointer text-primary border-primary"
      onClick={() => setFeedbackExpanded((prev) => !prev)}
    >
      {feedback}
    </div>
  );
};
const NormalMessage = ({ message }: MessageProps) => {
  const text = getMessageText(message);
  return (
    <div className="bg-primary text-white w-fit rounded-md p-4 mx-4 flex gap-2">
      <div> {message.role === 'user' ? 'You: ' : 'AI: '}</div>
      <div className="whitespace-pre-wrap -mt-6 pt-6">{text}</div>
    </div>
  );
};

const Message = ({ message }: MessageProps) => {
  const text = getMessageText(message);
  const feedback = getFeedbackFromParts(message);

  if (!text && !feedback) return null;

  if (!text && feedback) {
    return <FeedbackMessage feedback={feedback} />;
  }
  return <NormalMessage message={message} />;
};
  
interface InterviewSimulatorProps {
  questions: Question[];
}

interface ErrorResponse {
  error: string;
  message: string;
  suggestion?: string;
  flaggedContent?: string[];
}

export const InterviewSimulator = ({ questions }: InterviewSimulatorProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [input, setInput] = useState('');

  const filteredQuestions = questions.filter((q): q is Question => !!q?.text);
  const {
    messages,
    sendMessage,
    regenerate,
    status,
    error: chatError,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        questions: filteredQuestions,
      },
    }),
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === 'provideFeedback') {
        console.log('client side call- feedback:', toolCall);
      }
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    if (chatError) {
      try {
        const errorData = JSON.parse(chatError.message) as ErrorResponse;
        setError(errorData);
      } catch {
        setError({
          error: 'Error',
          message: chatError.message,
        });
      }
    }
  }, [chatError]);

  useEffect(() => {
    //if the last message has no text, we assume it was a function call, and we send a new call to the server.
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && getMessageText(lastMessage) === '' && !isLoading) {
      console.log('regenerating');
      regenerate();
    }
  }, [messages, isLoading, regenerate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useAutoScroll({
    messagesEndRef,
    messagesContainerRef,
    dependencies: [messages],
  });

  return (
    <div className="flex flex-col h-full">
      <div
        ref={messagesContainerRef}
        className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4"
      >
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 p-4 border-2 border-red-500 rounded-md">
          <div className="text-red-500 font-bold">{error.error}</div>
          <div className="mt-2">{error.message}</div>
          {error.suggestion && (
            <div className="mt-2 text-gray-600">{error.suggestion}</div>
          )}
          {error.flaggedContent && (
            <div className="mt-2">
              Content flagged in: {error.flaggedContent.join(', ')}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          autoFocus
          className="w-full border-2 border-primary/50 focus:border-primary focus:outline-none p-2 rounded"
          name="prompt"
          value={input}
          onChange={handleInputChange}
          placeholder={
            error ? 'Please revise your message...' : 'Type your message...'
          }
        />
        <button className="bg-primary text-white p-2 rounded mt-2" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
};
