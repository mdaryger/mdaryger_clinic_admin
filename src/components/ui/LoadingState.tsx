import { useI18n } from '../../i18n/useI18n';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="mt-3 text-sm font-medium text-slate-600">{label ?? t('common.loading')}</p>
    </div>
  );
}
