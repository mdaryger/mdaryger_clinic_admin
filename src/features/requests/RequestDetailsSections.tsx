import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { UrgencyChip } from '../../components/ui/UrgencyChip';
import { useI18n } from '../../i18n/useI18n';
import { getDoctorById, type Doctor } from '../../services/doctorService';
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

type PlannedVisitDate = {
  date: string;
  timeStart: string;
  timeEnd: string;
};

function parsePlannedVisitDate(notes: string | undefined): PlannedVisitDate | null {
  if (!notes) return null;
  const match = notes.match(/\[ПЛАНОВЫЙ ВИЗИТ на (\d{2}\.\d{2}\.\d{2,4}) в (\d{2}:\d{2}) - (\d{2}:\d{2})\]/);
  if (!match) return null;
  return { date: match[1], timeStart: match[2], timeEnd: match[3] };
}

function translateValue(
  value: string | undefined,
  namespace: string,
  t: (key: string) => string,
): string {
  if (!value) return '-';
  const translated = t(`${namespace}.${value}`);
  // If the key was not found, the i18n library returns the key itself — fall back to raw value
  return translated === `${namespace}.${value}` ? value : translated;
}

function DetailItem({ label, value, secondary }: { label: string; value: unknown; secondary?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">
        {value === undefined || value === null || value === '' ? '-' : String(value)}
      </p>
      {secondary ? <p className="mt-0.5 text-xs text-slate-400">{secondary}</p> : null}
    </div>
  );
}

type RequestDetailsSectionsProps = {
  request: RequestRecord;
};

export function RequestDetailsSections({ request }: RequestDetailsSectionsProps) {
  const { t } = useI18n();
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  const resolvedDoctorId = request.visitedDoctorId || request.selectedDoctorId || request.doctorId;
  const plannedVisit = request.source === 'plannedHomeVisit' ? parsePlannedVisitDate(request.patientNotes) : null;

  useEffect(() => {
    if (!resolvedDoctorId) return;
    void getDoctorById(resolvedDoctorId).then(setDoctor);
  }, [resolvedDoctorId]);

  const doctorFullName =
    doctor
      ? [doctor.name, doctor.lastName, doctor.middleName].filter(Boolean).join(' ')
      : request.doctorName || null;

  const doctorPhone = doctor?.phone || request.doctorPhone || null;
  const doctorSpecialist = doctor?.specialist || request.doctorSpecialist || null;

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
          {plannedVisit ? (
            <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="text-2xl">📅</div>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-600">{t('requests.plannedVisitDate')}</p>
                <p className="mt-0.5 text-base font-bold text-blue-900">
                  {plannedVisit.date} &nbsp;·&nbsp; {plannedVisit.timeStart} – {plannedVisit.timeEnd}
                </p>
              </div>
            </div>
          ) : null}
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
          <DetailItem label={t('requests.patientGender')} value={translateValue(request.patientGender, 'requests.gender', t)} />
          <div className="sm:col-span-2"><DetailItem label={t('requests.patientNotes')} value={request.patientNotes} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.visitSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.visitReason')} value={request.visitReason} />
          <DetailItem label={t('requests.symptoms')} value={request.symptoms} />
          <DetailItem label={t('requests.doctorType')} value={translateValue(request.doctorType, 'requests.doctorTypeLabel', t)} />
          <DetailItem label={t('requests.departmentId')} value={translateValue(request.departmentId, 'requests.department', t)} />
          <DetailItem
            label={t('requests.location')}
            value={[request.latitude, request.longitude].filter((v) => v !== null && v !== undefined).join(', ')}
          />
          <DetailItem label={t('requests.timeDoctorToPatients')} value={request.timeDoctorToPatients} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.doctorSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem
            label={t('requests.doctorName')}
            value={doctorFullName || '-'}
            secondary={resolvedDoctorId ? `ID: ${resolvedDoctorId}` : undefined}
          />
          <DetailItem label={t('requests.doctorPhone')} value={doctorPhone} />
          <DetailItem label={t('requests.doctorSpecialist')} value={doctorSpecialist} />
          {request.visitedDoctorId && request.visitedDoctorId !== resolvedDoctorId ? (
            <DetailItem label={t('requests.visitedDoctorId')} value={request.visitedDoctorId} />
          ) : null}
          <DetailItem label={t('requests.doctorNotes')} value={request.doctorNotes} />
          <div className="sm:col-span-2">
            <DetailItem label={t('requests.doctorNoteAboutVisit')} value={request.doctorNoteAboutVisit} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.financialSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.cost')} value={request.cost} />
          <DetailItem label={t('requests.estimatedPrice')} value={request.estimatedPrice} />
          <DetailItem label={t('requests.finalPrice')} value={request.finalPrice} />
          <DetailItem label={t('requests.paymentStatus')} value={translateValue(request.paymentStatus, 'requests.paymentStatusLabel', t)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">{t('requests.cancellationReviewSection')}</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('requests.cancellationReason')} value={request.cancellationReason} />
          <DetailItem label={t('requests.cancelledBy')} value={translateValue(request.cancelledBy, 'requests.cancelledByLabel', t)} />
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
