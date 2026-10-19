import { AuthGuard } from '@/components/auth/AuthGuard';
import { QuizStudio } from '@/components/studio/QuizStudio';

export default function EditQuizPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <QuizStudio initialQuizId={params.id} isNew={false} />
    </AuthGuard>
  );
}
