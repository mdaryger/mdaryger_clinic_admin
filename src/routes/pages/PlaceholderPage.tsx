import { PageHeader } from '../../components/PageHeader';

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description ?? 'This screen is ready for implementation.'} />
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">Placeholder page</p>
      </section>
    </>
  );
}
