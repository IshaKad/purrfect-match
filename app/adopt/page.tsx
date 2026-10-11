
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import CatCard, { type Cat } from '@/components/CatCard';
import { createClient } from '@/lib/supabase/client';

const fallbackImage =
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85';

const cardColors = [
  '#FBE1D9',
  '#D9E9D9',
  '#E4D9F7',
  '#FFE9B4',
  '#F7DCE8',
  '#D6EAF4',
];

export default function AdoptPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('All areas');
  const [status, setStatus] = useState('All cats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCats() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('cats')
        .select(
          'id, name, age_label, gender, area, personality, photo_url, status'
        )
        .eq('is_published', true)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const mappedCats: Cat[] = (data ?? []).map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        age: cat.age_label,
        gender: cat.gender,
        area: cat.area,
        personality: cat.personality,
        status: 'Ready to meet',
        image: cat.photo_url || fallbackImage,
        bg: cardColors[index % cardColors.length],
      }));

      setCats(mappedCats);
      setLoading(false);
    }

    loadCats();
  }, []);

  const filtered = useMemo(
    () =>
      cats.filter(
        (cat) =>
          (
            cat.name +
            ' ' +
            cat.personality +
            ' ' +
            cat.area +
            ' ' +
            cat.age
          )
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (area === 'All areas' || cat.area === area) &&
          (status === 'All cats' || cat.status === status)
      ),
    [cats, search, area, status]
  );

  function resetFilters() {
    setSearch('');
    setArea('All areas');
    setStatus('All cats');
  }

  return (
    <div className="mx-auto min-h-[65vh] max-w-7xl px-5 py-12 lg:px-8">
      <div className="rounded-[32px] bg-[#E9DDF9] px-6 py-10 sm:px-10">
        <p className="eyebrow">Adoption station · Mumbai</p>

        <h1 className="section-title mt-3">
          Warning: may cause
          <br />
          excessive smiling.
        </h1>

        <p className="mt-4 max-w-xl leading-7 text-[#71617d]">
          Meet cats looking for a home, a lap, and someone
          who understands 3 a.m. zoomies.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold">
            Meet their personalities
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold">
            Find your match
          </span>
        </div>
      </div>

      <div className="mt-9 flex flex-col gap-3 rounded-2xl border border-[#efe7dd] bg-white p-4 md:flex-row">
        <label className="relative flex-1">
          <Search
            className="absolute left-3 top-3.5 text-[#9b8ba0]"
            size={18}
          />
          <input
            className="field pl-10"
            placeholder="Search names, vibes, neighbourhoods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2">
          <SlidersHorizontal
            size={17}
            className="text-[#9b8ba0]"
          />
          <select
            aria-label="Filter by area"
            className="field md:w-48"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option>All areas</option>
            {[...new Set(cats.map((cat) => cat.area))]
              .sort()
              .map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
          </select>
        </label>

        <select
          aria-label="Adoption status"
          className="field md:w-52"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All cats</option>
          <option>Ready to meet</option>
        </select>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-extrabold">
          {loading
            ? 'Finding our furry friends...'
            : `${filtered.length} little ${
                filtered.length === 1
                  ? 'personality'
                  : 'personalities'
              } found`}
        </p>

        <p className="text-xs text-[#938599]">
          Live adoption listings
        </p>
      </div>

      {loading ? (
        <div className="mt-8 rounded-3xl bg-white py-16 text-center">
          <p className="text-xl font-black">
            Loading tiny troublemakers...
          </p>
          <p className="mt-2 text-[#84768a]">
            Fetching our latest cat profiles.
          </p>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-3xl bg-white px-6 py-12 text-center">
          <h2 className="text-2xl font-black">
            Our whiskers got tangled.
          </h2>
          <p className="mt-3 text-sm text-red-600">
            We couldn&apos;t load the cat listings.
          </p>
          <p className="mt-2 break-words text-sm text-[#84768a]">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-coral mt-5"
          >
            Try again
          </button>
        </div>
      ) : filtered.length > 0 ? (
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl bg-white py-16 text-center">
          <p className="text-5xl">🐈</p>
          <h2 className="mt-4 text-2xl font-black">
            No cats found in this little corner.
          </h2>
          <p className="mt-2 text-[#84768a]">
            {cats.length === 0
              ? 'No published cats are available right now.'
              : 'Try another search. The whiskers are hiding!'}
          </p>
          <button
            onClick={resetFilters}
            className="btn btn-coral mt-5"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
