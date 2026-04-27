import { zodResolver } from '@hookform/resolvers/zod';
import { serverTimestamp } from 'firebase/firestore';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useCities } from '../hooks/useCities';
import { useCountries } from '../hooks/useCountries';
import { passwordConfirmationBaseSchema } from '../lib/validation/authSchema';
import { createDocSafe } from '../services/baseFirestore';
import { registerWithEmail } from '../services/authService';
import { getActiveClinics } from '../services/clinicService';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import type { Clinic } from '../types/clinic';

const registerUserSchema = passwordConfirmationBaseSchema
  .extend({
    firstName: z.string().min(1, 'Имя обязательно'),
    lastName: z.string().min(1, 'Фамилия обязательна'),
    phone: z.string().min(1, 'Номер телефона обязателен'),
    countryId: z.string().min(1, 'Страна обязательна'),
    cityId: z.string().min(1, 'Город обязателен'),
    clinicId: z.string().min(1, 'Выберите клинику'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

type RegisterUserFormValues = z.infer<typeof registerUserSchema>;

type AdminRegistrationDocument = {
  uid: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: 'clinicAdmin';
  clinicId: string;
  clinic: Record<string, unknown> | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

export function RegisterUserPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterUserFormValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryId: '',
      cityId: '',
      clinicId: '',
      password: '',
      confirmPassword: '',
    },
  });
  const selectedCountryId = watch('countryId');
  const selectedCityId = watch('cityId');
  const { countries, loading: countriesLoading } = useCountries(true);
  const { cities, loading: citiesLoading } = useCities(selectedCountryId);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const activeClinics = await getActiveClinics();

        if (isMounted) {
          setClinics(activeClinics);
        }
      } finally {
        if (isMounted) {
          setClinicsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!countries.length || selectedCountryId) {
      return;
    }

    const kyrgyzstan = countries.find((country) => {
      const normalizedName = country.name.trim().toLowerCase();

      return normalizedName === 'kyrgyzstan' || normalizedName === 'кыргызстан';
    });

    if (kyrgyzstan) {
      setValue('countryId', kyrgyzstan.id, { shouldValidate: true });
    }
  }, [countries, selectedCountryId, setValue]);

  useEffect(() => {
    if (!selectedCountryId) {
      setValue('cityId', '');
      setValue('clinicId', '');
      return;
    }

    const hasSelectedCity = cities.some((city) => city.id === selectedCityId);

    if (selectedCityId && !hasSelectedCity) {
      setValue('cityId', '');
      setValue('clinicId', '');
    }
  }, [cities, selectedCityId, selectedCountryId, setValue]);

  const filteredClinics = useMemo(() => {
    if (!selectedCityId) {
      return clinics;
    }

    return clinics.filter((clinic) => clinic.cityId === selectedCityId);
  }, [clinics, selectedCityId]);

  const onSubmit = async (values: RegisterUserFormValues) => {
    setIsSubmitting(true);

    try {
      const user = await registerWithEmail(values.email, values.password);
      const selectedClinic = clinics.find((clinic) => clinic.id === values.clinicId) ?? null;

      await createDocSafe<AdminRegistrationDocument>('clinic_admin', user.uid, {
        uid: user.uid,
        email: values.email,
        phone: values.phone,
        firstName: values.firstName,
        lastName: values.lastName,
        displayName: `${values.firstName} ${values.lastName}`,
        role: 'clinicAdmin',
        clinicId: values.clinicId,
        clinic: selectedClinic,
        isActive: true,
        isEmailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await refreshProfile();
      showToast({ type: 'success', title: 'Аккаунт создан', description: 'Вы уже вошли в систему.' });
      navigate('/home', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось зарегистрировать пользователя.';
      showToast({ type: 'error', title: 'Ошибка регистрации', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-5xl rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-6 border-b border-slate-100 pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            New Clinic Admin
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Регистрация</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Создайте аккаунт администратора клиники. Мы сделали форму компактнее и удобнее для быстрого заполнения.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Уже зарегистрированы?{' '}
          <Link className="font-semibold text-primary hover:text-primary/80" to="/login">
            Войти
          </Link>
        </div>
      </div>

      <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Имя" error={errors.firstName?.message} className="h-12 rounded-2xl border-slate-200 px-4" {...register('firstName')} />
        <Input label="Фамилия" error={errors.lastName?.message} className="h-12 rounded-2xl border-slate-200 px-4" {...register('lastName')} />
        <Input
          label="Электронная почта"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          className="h-12 rounded-2xl border-slate-200 px-4"
          {...register('email')}
        />
        <Input
          label="Номер телефона"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          className="h-12 rounded-2xl border-slate-200 px-4"
          {...register('phone')}
        />

        <Select
          label="Страна"
          value={selectedCountryId}
          disabled={countriesLoading}
          error={errors.countryId?.message}
          className="h-12 rounded-2xl border-slate-200 px-4"
          onChange={(event) => {
            setValue('countryId', event.target.value, { shouldValidate: true });
            setValue('cityId', '', { shouldValidate: true });
            setValue('clinicId', '', { shouldValidate: true });
          }}
        >
          <option value="">{countriesLoading ? 'Загрузка стран...' : 'Выберите страну'}</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </Select>

        <Select
          label="Город"
          value={selectedCityId}
          disabled={!selectedCountryId || citiesLoading}
          error={errors.cityId?.message}
          className="h-12 rounded-2xl border-slate-200 px-4"
          onChange={(event) => {
            setValue('cityId', event.target.value, { shouldValidate: true });
            setValue('clinicId', '', { shouldValidate: true });
          }}
        >
          <option value="">
            {!selectedCountryId ? 'Сначала выберите страну' : citiesLoading ? 'Загрузка городов...' : 'Выберите город'}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name.ru || city.name.en || city.id}
            </option>
          ))}
        </Select>

        <Select
          label="Клиника"
          value={watch('clinicId')}
          disabled={clinicsLoading || filteredClinics.length === 0}
          error={errors.clinicId?.message}
          className="h-12 rounded-2xl border-slate-200 px-4 sm:col-span-2"
          onChange={(event) => setValue('clinicId', event.target.value, { shouldValidate: true })}
        >
          <option value="">
            {clinicsLoading
              ? 'Загрузка клиник...'
              : filteredClinics.length === 0
                ? 'Нет доступных клиник'
                : 'Выберите клинику'}
          </option>
          {filteredClinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </Select>

        <div className="relative sm:col-span-2">
          <Input
            label="Пароль"
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            error={errors.password?.message}
            className="h-12 rounded-2xl border-slate-200 px-4 pr-12"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((value) => !value)}
            className="absolute right-3 top-8 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="relative sm:col-span-2">
          <Input
            label="Подтвердите пароль"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            className="h-12 rounded-2xl border-slate-200 px-4 pr-12"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setIsConfirmPasswordVisible((value) => !value)}
            className="absolute right-3 top-8 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={isConfirmPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {isConfirmPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-4 sm:col-span-2">
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="h-12 rounded-2xl text-base font-semibold shadow-[0_16px_35px_rgba(99,102,241,0.28)]"
          >
            <UserPlus className="h-5 w-5" aria-hidden="true" />
            Создать аккаунт
          </Button>

          <p className="text-center text-sm text-slate-500">
            Уже есть аккаунт?{' '}
            <Link className="font-semibold text-primary hover:text-primary/80" to="/login">
              Войти
            </Link>
          </p>
        </div>
      </form>
    </section>
  );
}
