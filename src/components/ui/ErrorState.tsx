import { AlertCircle } from 'lucide-react';

import { useI18n } from '../../i18n/useI18n';
import { Button } from './Button';

type ErrorStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
}: ErrorStateProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t('errorState.title');
  const resolvedDescription = description ?? t('errorState.description');

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
      <h3 className="mt-3 text-base font-semibold text-red-950">{resolvedTitle}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{resolvedDescription}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant="danger" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
