export interface FinalQuizRetryPolicyInput {
  allowRetry?: boolean;
  hideCorrectAnswer?: boolean;
  scoreDecayPercent?: number;
}

export interface UpdateFinalQuizConfigInput {
  quizName?: string;
  xpReward?: number;
  totalQuestions?: number;
  passingScore?: number;
  maxAttempts?: number;
  retryPolicy?: FinalQuizRetryPolicyInput;
}

export interface FinalQuizQuestionInput {
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export interface FinalQuizQuestionDTO {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
  sortOrder: number;
}

export interface FinalQuizDTO {
  quizName: string;
  xpReward: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  retryPolicy: {
    allowRetry: boolean;
    hideCorrectAnswer: boolean;
    scoreDecayPercent: number;
  };
  questions: FinalQuizQuestionDTO[];
}
