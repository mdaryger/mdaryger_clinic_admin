import { Link } from 'react-router-dom';

import { ROUTES } from '../constants/routes';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-center">
      <section>
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Page not found</h1>
        <Link className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" to={ROUTES.root}>
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
