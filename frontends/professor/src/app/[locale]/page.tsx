import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LocaleIndexPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/dashboard`);
}

