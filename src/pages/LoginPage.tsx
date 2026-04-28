import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useI18n } from '../i18n/useI18n';
import { loginSchema, type LoginSchemaValues } from '../lib/validation/authSchema';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export function LoginPage() {
  const { t } = useI18n();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const showToast = useToastStore((state) => state.showToast);
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
    try {
      await login(values.email, values.password);
      showToast({ type: 'success', title: t('login.welcomeBack') });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      showToast({ type: 'error', title: t('login.loginFailed'), description: message });
    }
  };

  return (
    <section className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
      <div className="mb-8">
        <div className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Admin Access
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{t('login.title')}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Войдите в кабинет, чтобы управлять клиниками, заявками и врачами.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={t('login.email')}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          className="h-12 rounded-2xl border-slate-200 px-4"
          {...register('email')}
        />

        <div>
          <div className="relative">
            <Input
              label={t('login.password')}
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              error={errors.password?.message}
              className="h-12 rounded-2xl border-slate-200 px-4 pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((value) => !value)}
              className="absolute right-3 top-8 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={isPasswordVisible ? t('login.hidePassword') : t('login.showPassword')}
            >
              {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl text-base shadow-[0_16px_35px_rgba(99,102,241,0.28)]" isLoading={isLoading}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {t('login.submit')}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        {t('login.noAccount')}{' '}
        <Link className="font-semibold text-primary hover:text-primary/80" to="/register">
          {t('login.register')}
        </Link>
      </p>
    </section>
  );
}
