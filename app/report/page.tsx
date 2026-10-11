
'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type ReportForm = {
  reporter_name: string;
  reporter_phone: string;
  area: string;
  landmark: string;
  urgency: string;
  description: string;
};

const initialForm: ReportForm = {
  reporter_name: '',
  reporter_phone: '',
  area: '',
  landmark: '',
  urgency: 'routine',
  description: '',
};

export default function ReportCatPage() {
  const [form, setForm] = useState<ReportForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceCode, setReferenceCode] = useState('');

  function updateField(
    field: keyof ReportForm,
    value: string
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setReferenceCode('');

    const phone = form.reporter_phone.trim();
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15) {
      setError('Please enter a valid phone number.');
      return;
    }

    if (form.description.trim().length < 15) {
      setError('Please describe the cat’s situation in at least 15 characters.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Generate the reference locally so we can display it
      // without granting public read access to rescue reports.
      const code =
        'PM-' +
        crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

      const { error: insertError } = await supabase
        .from('rescue_reports')
        .insert({
          reference_code: code,
          reporter_name: form.reporter_name.trim(),
          reporter_phone: phone,
          area: form.area.trim(),
          landmark: form.landmark.trim() || null,
          urgency: form.urgency,
          description: form.description.trim(),
          reporter_id: null,
        });

      if (insertError) {
        console.error('Rescue report submission failed:', insertError);
        throw new Error(
          'We could not submit your report. Please try again.'
        );
      }

      setReferenceCode(code);
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (referenceCode) {
    return (
      <main className="min-h-screen bg-[#fffaf6] px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm sm:p-12">
          <CheckCircle2 className="mx-auto mb-5 h-16 w-16 text-green-600" />

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
            Report received
          </p>

          <h1 className="mb-3 text-3xl font-bold text-stone-900">
            Thank you for speaking up.
          </h1>

          <p className="mb-6 leading-7 text-stone-600">
            Your rescue report has been submitted. Please save
            this reference code for your records.
          </p>

          <div className="mb-6 rounded-2xl bg-orange-50 p-5">
            <p className="mb-2 text-sm text-stone-500">
              Your reference number
            </p>
            <p className="text-2xl font-bold tracking-widest text-orange-700">
              {referenceCode}
            </p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(referenceCode)}
              className="mt-3 text-sm font-semibold text-orange-700 underline"
            >
              Copy reference number
            </button>
          </div>

          <p className="mb-7 text-sm leading-6 text-stone-500">
            If the cat is in immediate danger, contact a local
            animal rescue organisation directly as well.
          </p>

          <Link
            href="/"
            className="inline-flex rounded-full bg-stone-900 px-7 py-3 font-semibold text-white transition hover:bg-stone-700"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-orange-700"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <div className="mb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
            Purrfect Match · Community Rescue
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Help a cat in need.
          </h1>

          <p className="max-w-2xl leading-7 text-stone-600">
            Seen an injured, abandoned, or vulnerable cat?
            Tell us what is happening and where the cat needs help.
          </p>
        </div>

        <div className="mb-8 flex gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <MapPin className="mt-1 shrink-0 text-orange-700" size={22} />
          <div>
            <p className="font-semibold text-stone-900">
              Location matters
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Include the area and a nearby landmark so rescuers
              can identify the location.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9"
        >
          <section className="space-y-5">
            <h2 className="text-xl font-bold text-stone-900">
              Your contact details
            </h2>

            <div>
              <label htmlFor="reporter_name" className="mb-2 block text-sm font-semibold text-stone-700">
                Full name *
              </label>
              <input
                id="reporter_name"
                required
                maxLength={100}
                autoComplete="name"
                value={form.reporter_name}
                onChange={(e) => updateField('reporter_name', e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label htmlFor="reporter_phone" className="mb-2 block text-sm font-semibold text-stone-700">
                Phone number *
              </label>
              <input
                id="reporter_phone"
                type="tel"
                required
                maxLength={20}
                autoComplete="tel"
                value={form.reporter_phone}
                onChange={(e) => updateField('reporter_phone', e.target.value)}
                placeholder="Enter a number rescuers can contact"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </section>

          <div className="h-px bg-stone-100" />

          <section className="space-y-5">
            <h2 className="text-xl font-bold text-stone-900">
              Where is the cat?
            </h2>

            <div>
              <label htmlFor="area" className="mb-2 block text-sm font-semibold text-stone-700">
                Area or locality *
              </label>
              <input
                id="area"
                required
                maxLength={150}
                value={form.area}
                onChange={(e) => updateField('area', e.target.value)}
                placeholder="e.g. Andheri West, Mumbai"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label htmlFor="landmark" className="mb-2 block text-sm font-semibold text-stone-700">
                Nearby landmark
              </label>
              <input
                id="landmark"
                maxLength={200}
                value={form.landmark}
                onChange={(e) => updateField('landmark', e.target.value)}
                placeholder="Street, building, shop, or other landmark"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </section>

          <div className="h-px bg-stone-100" />

          <section className="space-y-5">
            <h2 className="text-xl font-bold text-stone-900">
              Tell us what happened
            </h2>

            <div>
              <label htmlFor="urgency" className="mb-2 block text-sm font-semibold text-stone-700">
                How urgent is the situation? *
              </label>
              <select
                id="urgency"
                required
                value={form.urgency}
                onChange={(e) => updateField('urgency', e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="routine">Routine — cat needs general help</option>
                <option value="urgent">Urgent — cat appears unwell or at risk</option>
                <option value="emergency">Emergency — immediate danger or serious injury</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-semibold text-stone-700">
                Description of the situation *
              </label>
              <textarea
                id="description"
                required
                minLength={15}
                maxLength={2000}
                rows={6}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the cat, its condition, how many cats need help, and anything else rescuers should know..."
                className="w-full resize-y rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              <p className="mt-2 text-right text-xs text-stone-400">
                {form.description.length}/2000 characters
              </p>
            </div>
          </section>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-stone-500" size={20} />
            <p className="text-sm leading-6 text-stone-600">
              Your contact details will be stored with your report
              so the rescue team can follow up. Do not include
              unnecessary personal information in the description.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-orange-600 px-6 py-4 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Submitting report...' : 'Submit rescue report'}
          </button>

          <p className="text-center text-xs leading-5 text-stone-400">
            Submitting a report does not guarantee immediate rescue.
            For an emergency, contact a local rescue service directly.
          </p>
        </form>
      </div>
    </main>
  );
}
