import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { UrgencyChip } from '../../components/ui/UrgencyChip';
import { useI18n } from '../../i18n/useI18n';
import type { RequestRecord } from '../../services/requestService';

function formatDate(value: unknown): string {
  if (!value) {
    return '-';
  }

  if (typeof value === 'object') {
    const timestampLike = value as { toDate?: () => Date; seconds?: number };

    if (typeof timestampLike.toDate === 'function') {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(timestampLike.toDate());
    }

    if (typeof timestampLike.seconds === 'number') {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(timestampLike.seconds * 1000));
    }
  }

  const date = new Date(String(value));

  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
}

function DetailItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value === undefined || value === null || value === '' ? '-' : String(value)}</p>
    </div>
  );
}

type RequestDetailsSectionsProps = {
  request: RequestRecord;
};

export function RequestDetailsSections({ request }: RequestDetailsSectionsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-950">{t('requests.requestWithId', { id: request.id })}</h2>
            <StatusChip status={request.status} />
            <UrgencyChip urgency={request.urgency} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.createdAt')} value={formatDate(request.createdAt)} />
          <DetailItem label={t('requests.updatedAt')} value={formatDate(request.updatedAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.patientSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.patientName')} value={request.patientName} />
          <DetailItem label={t('requests.patientPhone')} value={request.patientPhone} />
          <DetailItem label={t('requests.patientAddress')} value={request.patientAddress} />
          <DetailItem label={t('requests.patientGender')} value={request.patientGender} />
          <div className="sm:col-span-2"><DetailItem label={t('requests.patientNotes')} value={request.patientNotes} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.visitSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.visitReason')} value={request.visitReason} />
          <DetailItem label={t('requests.symptoms')} value={request.symptoms} />
          <DetailItem label={t('requests.doctorType')} value={request.doctorType} />
          <DetailItem label={t('requests.departmentId')} value={request.departmentId} />
          <DetailItem label={t('requests.location')} value={[request.latitude, request.longitude].filter((item) => item !== null && item !== undefined).join(', ')} />
          <DetailItem label={t('requests.timeDoctorToPatients')} value={request.timeDoctorToPatients} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.doctorSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.doctorId')} value={request.doctorId} />
          <DetailItem label={t('requests.selectedDoctorId')} value={request.selectedDoctorId} />
          <DetailItem label={t('requests.visitedDoctorId')} value={request.visitedDoctorId} />
          <DetailItem label={t('requests.doctorName')} value={request.doctorName} />
          <DetailItem label={t('requests.doctorPhone')} value={request.doctorPhone} />
          <DetailItem label={t('requests.doctorSpecialist')} value={request.doctorSpecialist} />
          <DetailItem label={t('requests.doctorAvatar')} value={request.doctorAvatar} />
          <DetailItem label={t('requests.doctorNotes')} value={request.doctorNotes} />
          <div className="sm:col-span-2"><DetailItem label={t('requests.doctorNoteAboutVisit')} value={request.doctorNoteAboutVisit} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.financialSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.cost')} value={request.cost} />
          <DetailItem label={t('requests.estimatedPrice')} value={request.estimatedPrice} />
          <DetailItem label={t('requests.finalPrice')} value={request.finalPrice} />
          <DetailItem label={t('requests.paymentStatus')} value={request.paymentStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.cancellationReviewSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.cancellationReason')} value={request.cancellationReason} />
          <DetailItem label={t('requests.cancelledBy')} value={request.cancelledBy} />
          <DetailItem label={t('requests.patientRating')} value={request.patientRating} />
          <DetailItem label={t('requests.reviewedAt')} value={formatDate(request.reviewedAt)} />
          <div className="sm:col-span-2"><DetailItem label={t('requests.patientReview')} value={request.patientReview} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.timelineSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.createdAt')} value={formatDate(request.createdAt)} />
          <DetailItem label={t('requests.acceptedAt')} value={formatDate(request.acceptedAt)} />
          <DetailItem label={t('requests.startedAt')} value={formatDate(request.startedAt)} />
          <DetailItem label={t('requests.completedAt')} value={formatDate(request.completedAt)} />
          <DetailItem label={t('requests.cancelledAt')} value={formatDate(request.cancelledAt)} />
          <DetailItem label={t('requests.updatedAt')} value={formatDate(request.updatedAt)} />
        </CardContent>
      </Card>
    </div>
  );
}
