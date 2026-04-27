import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { loginSchema, type LoginSchemaValues } from '../lib/validation/authSchema';
import { ROUTES } from '../constants/routes';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginSchemaValues) => {
    await login(values.email, values.password);
    navigate(ROUTES.root);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Clinics Admin Web</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Sign in</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email ? <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password ? (
              <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>
            ) : null}
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
