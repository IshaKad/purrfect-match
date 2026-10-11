
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState('Not tested yet');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  async function testConnection() {
    setLoading(true);
    setStatus('Connecting to Supabase...');
    setDetails('');

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .limit(1);

      if (error) {
        setStatus('Connection test failed');
        setDetails(`${error.message} (Code: ${error.code})`);
      } else {
        setStatus('Connected successfully!');
        setDetails(
          `The cats table is accessible. Rows returned: ${data.length}`
        );
      }
    } catch (error) {
      setStatus('Connection test failed');
      setDetails(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-amber-50 p-8 text-stone-800">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold">
          Purrfect Match
        </h1>

        <p className="mt-2 text-stone-600">
          Supabase database connection test
        </p>

        <button
          onClick={testConnection}
          disabled={loading}
          className="mt-6 rounded-xl bg-orange-500 px-5 py-3
                     font-semibold text-white hover:bg-orange-600
                     disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test database connection'}
        </button>

        <div className="mt-6 rounded-xl bg-amber-50 p-4">
          <p className="font-semibold">{status}</p>
          <p className="mt-2 break-words text-sm text-stone-600">
            {details}
          </p>
        </div>
      </div>
    </main>
  );
}
