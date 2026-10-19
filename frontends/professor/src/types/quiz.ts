export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

export interface AnswerOption {
  id?: string;
  orderIndex: number;
  optionText: string;
  isCorrect: boolean;
  colorShapeIndex?: number;
}

export interface Question {
  id?: string;
  quizId?: string;
  orderIndex: number;
  questionText: string;
  questionType: QuestionType;
  timeLimitSeconds: number; // 5, 10, 20, 30, 60, 120
  pointsMultiplier: string; // '0.00', '1.00', '2.00'
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  showAnswersOnDevice?: boolean;
  answerOptions: AnswerOption[];
}

export interface Quiz {
  id: string;
  professorId?: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  themeId?: string | null;
  isPublic?: boolean;
  sessionDurationMinutes?: number;
  level?: string | null; // e.g. "Grade 10", "A1 Beginner", "University"
  subject?: string | null; // e.g. "Mathematics", "Science", "History"
  folder?: string | null; // e.g. "Term 1 / Unit 2"
  tags?: string[];
  playCount?: number;
  defaultQuestionTimeLimitSeconds?: number;
  defaultExecutionMode?: 'MANUAL' | 'AUTOMATIC';
  createdAt?: string;
  updatedAt?: string;
  questions?: Question[];
}

export interface QuizListFilter {
  search?: string;
  tag?: string;
  level?: string;
  subject?: string;
  folder?: string;
  page?: number;
  limit?: number;
}

