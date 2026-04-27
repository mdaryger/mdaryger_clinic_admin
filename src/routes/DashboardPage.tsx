import { Activity, Building2, Stethoscope, Users } from 'lucide-react';

import { PageHeader } from '../components/PageHeader';

const stats = [
  { label: 'Clinics', value: '0', icon: Building2 },
  { label: 'Doctors', value: '0', icon: Stethoscope },
  { label: 'Patients', value: '0', icon: Users },
  { label: 'Appointments', value: '0', icon: Activity },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Overview of clinics, doctors, patients, and activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <section key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">{stat.label}</span>
              <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <strong className="mt-4 block text-3xl font-semibold text-slate-950">{stat.value}</strong>
          </section>
        ))}
      </div>
    </>
  );
}
