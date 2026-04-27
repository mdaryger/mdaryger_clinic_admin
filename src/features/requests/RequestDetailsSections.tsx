import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { UrgencyChip } from '../../components/ui/UrgencyChip';
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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Request {request.id}</h2>
            <StatusChip status={request.status} />
            <UrgencyChip urgency={request.urgency} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Created at" value={formatDate(request.createdAt)} />
          <DetailItem label="Updated at" value={formatDate(request.updatedAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">Patient</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Patient name" value={request.patientName} />
          <DetailItem label="Patient phone" value={request.patientPhone} />
          <DetailItem label="Patient address" value={request.patientAddress} />
          <DetailItem label="Patient gender" value={request.patientGender} />
          <div className="sm:col-span-2"><DetailItem label="Patient notes" value={request.patientNotes} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">Visit</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Visit reason" value={request.visitReason} />
          <DetailItem label="Symptoms" value={request.symptoms} />
          <DetailItem label="Doctor type" value={request.doctorType} />
          <DetailItem label="Department ID" value={request.departmentId} />
          <DetailItem label="Latitude / Longitude" value={[request.latitude, request.longitude].filter((item) => item !== null && item !== undefined).join(', ')} />
          <DetailItem label="Time doctor to patients" value={request.timeDoctorToPatients} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">Doctor</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Doctor ID" value={request.doctorId} />
          <DetailItem label="Selected doctor ID" value={request.selectedDoctorId} />
          <DetailItem label="Visited doctor ID" value={request.visitedDoctorId} />
          <DetailItem label="Doctor name" value={request.doctorName} />
          <DetailItem label="Doctor phone" value={request.doctorPhone} />
          <DetailItem label="Doctor specialist" value={request.doctorSpecialist} />
          <DetailItem label="Doctor avatar" value={request.doctorAvatar} />
          <DetailItem label="Doctor notes" value={request.doctorNotes} />
          <div className="sm:col-span-2"><DetailItem label="Doctor note about visit" value={request.doctorNoteAboutVisit} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">Financial</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Cost" value={request.cost} />
          <DetailItem label="Estimated price" value={request.estimatedPrice} />
          <DetailItem label="Final price" value={request.finalPrice} />
          <DetailItem label="Payment status" value={request.paymentStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">Cancellation / Review</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Cancellation reason" value={request.cancellationReason} />
          <DetailItem label="Cancelled by" value={request.cancelledBy} />
          <DetailItem label="Patient rating" value={request.patientRating} />
          <DetailItem label="Reviewed at" value={formatDate(request.reviewedAt)} />
          <div className="sm:col-span-2"><DetailItem label="Patient review" value={request.patientReview} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-slate-950">Timeline</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Created at" value={formatDate(request.createdAt)} />
          <DetailItem label="Accepted at" value={formatDate(request.acceptedAt)} />
          <DetailItem label="Started at" value={formatDate(request.startedAt)} />
          <DetailItem label="Completed at" value={formatDate(request.completedAt)} />
          <DetailItem label="Cancelled at" value={formatDate(request.cancelledAt)} />
          <DetailItem label="Updated at" value={formatDate(request.updatedAt)} />
        </CardContent>
      </Card>
    </div>
  );
}
