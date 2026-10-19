import { AuthGuard } from '@/components/auth/AuthGuard';
import { QuizStudio } from '@/components/studio/QuizStudio';

export default function NewQuizPage() {
  return (
    <AuthGuard>
      <QuizStudio isNew={true} />
    </AuthGuard>
  );
}
