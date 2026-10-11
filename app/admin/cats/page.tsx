
'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Cat as CatIcon,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type CatStatus =
  | 'available'
  | 'foster'
  | 'medical_care'
  | 'adoption_pending'
  | 'adopted'
  | 'unavailable';

type CatRecord = {
  id: string;
  name: string;
  age_label: string;
  gender: 'Girl' | 'Boy' | 'Unknown';
  area: string;
  personality: string;
  description: string;
  photo_url: string | null;
  status: CatStatus;
  is_published: boolean;
  created_at: string;
};

type CatForm = {
  name: string;
  age_label: string;
  gender: 'Girl' | 'Boy' | 'Unknown';
  area: string;
  personality: string;
  description: string;
  status: CatStatus;
  is_published: boolean;
};

const emptyForm: CatForm = {
  name: '',
  age_label: '',
  gender: 'Unknown',
  area: '',
  personality: '',
  description: '',
  status: 'available',
  is_published: false,
};

const statusOptions: { value: CatStatus; label: string }[] = [
  { value: 'available', label: 'Available for adoption' },
  { value: 'foster', label: 'In foster care' },
  { value: 'medical_care', label: 'Medical care' },
  { value: 'adoption_pending', label: 'Adoption pending' },
  { value: 'adopted', label: 'Adopted' },
  { value: 'unavailable', label: 'Unavailable' },
];

function statusLabel(status: CatStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

export default function CatManagementPage() {
  const [cats, setCats] = useState<CatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CatForm>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadCats = useCallback(async () => {
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('cats')
      .select(
        'id, name, age_label, gender, area, personality, description, photo_url, status, is_published, created_at'
      )
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(`Could not load cats: ${fetchError.message}`);
      setCats([]);
    } else {
      setCats((data ?? []) as CatRecord[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCats();
  }, [loadCats]);

  function startNewCat() {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setError('');
    setNotice('');
  }

  function startEdit(cat: CatRecord) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      age_label: cat.age_label,
      gender: cat.gender,
      area: cat.area,
      personality: cat.personality,
      description: cat.description ?? '',
      status: cat.status,
      is_published: cat.is_published,
    });
    setPhotoFile(null);
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateField<K extends keyof CatForm>(
    field: K,
    value: CatForm[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const supabase = createClient();
      let photoUrl: string | null =
        editingId
          ? cats.find((cat) => cat.id === editingId)?.photo_url ?? null
          : null;

      if (photoFile) {
        const extension = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `cats/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('cat-photos')
          .upload(path, photoFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: photoFile.type || undefined,
          });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from('cat-photos')
          .getPublicUrl(path);

        photoUrl = publicData.publicUrl;
      }

      const payload = {
        name: form.name.trim(),
        age_label: form.age_label.trim(),
        gender: form.gender,
        area: form.area.trim(),
        personality: form.personality.trim(),
        description: form.description.trim(),
        status: form.status,
        is_published: form.is_published,
        photo_url: photoUrl,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('cats')
          .update(payload)
          .eq('id', editingId);

        if (updateError) {
          throw new Error(`Could not update cat: ${updateError.message}`);
        }

        setNotice(`${form.name}’s profile has been updated.`);
      } else {
        const { error: insertError } = await supabase
          .from('cats')
          .insert(payload);

        if (insertError) {
          throw new Error(`Could not add cat: ${insertError.message}`);
        }

        setNotice(`${form.name} has been added to the rescue database.`);
      }

      setEditingId(null);
      setForm(emptyForm);
      setPhotoFile(null);
      await loadCats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(cat: CatRecord) {
    setError('');
    setNotice('');

    const supabase = createClient();
    const nextValue = !cat.is_published;

    const { error: updateError } = await supabase
      .from('cats')
      .update({ is_published: nextValue })
      .eq('id', cat.id);

    if (updateError) {
      setError(`Could not change listing visibility: ${updateError.message}`);
      return;
    }

    setCats((current) =>
      current.map((item) =>
        item.id === cat.id ? { ...item, is_published: nextValue } : item
      )
    );
    setNotice(
      `${cat.name} is now ${nextValue ? 'published' : 'unpublished'}.`
    );
  }

  async function deleteCat(cat: CatRecord) {
    const confirmed = window.confirm(
      `Permanently delete ${cat.name}'s profile? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(cat.id);
    setError('');
    setNotice('');

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('cats')
      .delete()
      .eq('id', cat.id);

    if (deleteError) {
      setError(`Could not delete ${cat.name}: ${deleteError.message}`);
    } else {
      setCats((current) => current.filter((item) => item.id !== cat.id));
      if (editingId === cat.id) startNewCat();
      setNotice(`${cat.name}’s profile has been deleted.`);
    }

    setDeletingId(null);
  }

  const filteredCats = cats.filter((cat) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      [cat.name, cat.area, cat.personality, cat.age_label]
        .some((value) => value?.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && cat.is_published) ||
      (statusFilter === 'unpublished' && !cat.is_published) ||
      cat.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const publishedCount = cats.filter((cat) => cat.is_published).length;
  const availableCount = cats.filter(
    (cat) => cat.status === 'available'
  ).length;

  return (
    <main className="min-h-screen bg-[#fffaf3] px-4 py-8 text-[#302923] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#8a7666] transition hover:text-[#e56c4b]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e56c4b]">
              Rescue operations / Inventory
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Cat management
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#827366]">
              Every profile is a chance at a happier little life. Manage
              rescue details, photos and adoption listings here.
            </p>
          </div>

          <button
            type="button"
            onClick={startNewCat}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e56c4b] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#cf5739]"
          >
            <Plus size={18} />
            Add a cat
          </button>
        </header>

        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#f0e5d8] bg-white p-5">
            <p className="text-sm text-[#827366]">Total profiles</p>
            <p className="mt-2 text-3xl font-black">{cats.length}</p>
          </div>
          <div className="rounded-2xl border border-[#f0e5d8] bg-white p-5">
            <p className="text-sm text-[#827366]">Published listings</p>
            <p className="mt-2 text-3xl font-black">{publishedCount}</p>
          </div>
          <div className="rounded-2xl border border-[#f0e5d8] bg-white p-5">
            <p className="text-sm text-[#827366]">Available for adoption</p>
            <p className="mt-2 text-3xl font-black">{availableCount}</p>
          </div>
        </section>

        {(notice || error) && (
          <div
            role={error ? 'alert' : 'status'}
            className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {error ? <X size={18} /> : <Check size={18} />}
            <p className="flex-1 break-words">{error || notice}</p>
            <button
              type="button"
              onClick={() => {
                setError('');
                setNotice('');
              }}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-2xl border border-[#f0e5d8] bg-white">
          <div className="border-b border-[#f0e5d8] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8c7d]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, area or personality..."
                  className="w-full rounded-xl border border-[#e8ddd1] bg-[#fffdf9] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#e56c4b]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-[#e8ddd1] bg-[#fffdf9] px-3 py-3 text-sm outline-none focus:border-[#e56c4b]"
                aria-label="Filter cat profiles"
              >
                <option value="all">All profiles</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void loadCats()}
                disabled={loading}
                aria-label="Refresh cat list"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8ddd1] px-4 py-3 text-sm font-semibold transition hover:bg-[#fffaf3] disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-[#827366]">
              <LoaderCircle size={20} className="animate-spin" />
              Loading your cats...
            </div>
          ) : filteredCats.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <CatIcon size={36} className="text-[#e8b09c]" />
              <h2 className="mt-3 font-bold">
                {cats.length === 0 ? 'Your cat list is empty' : 'No matching cats'}
              </h2>
              <p className="mt-1 text-sm text-[#827366]">
                {cats.length === 0
                  ? 'Add your first rescue profile to get started.'
                  : 'Try a different search or filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f2e9e0]">
              {filteredCats.map((cat) => (
                <article
                  key={cat.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#f8eee5]">
                    {cat.photo_url ? (
                      <img
                        src={cat.photo_url}
                        alt={cat.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#c9a998]">
                        <CatIcon size={32} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold">{cat.name}</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          cat.is_published
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {cat.is_published ? 'Published' : 'Unpublished'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#827366]">
                      {cat.age_label} · {cat.gender} · {cat.area}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#8c5d49]">
                      {cat.personality || 'Personality not added'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-[#fff4ed] px-2.5 py-1 text-xs font-semibold text-[#a65d43]">
                        {statusLabel(cat.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => void togglePublished(cat)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8ddd1] px-3 py-2 text-xs font-bold transition hover:bg-[#fffaf3]"
                    >
                      {cat.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                      {cat.is_published ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8ddd1] px-3 py-2 text-xs font-bold transition hover:bg-[#fffaf3]"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteCat(cat)}
                      disabled={deletingId === cat.id}
                      aria-label={`Delete ${cat.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === cat.id ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && filteredCats.length > 0 && (
            <div className="border-t border-[#f0e5d8] px-5 py-3 text-xs text-[#827366]">
              Showing {filteredCats.length} of {cats.length} cat profiles
            </div>
          )}
        </section>

        <section
          id="cat-editor"
          className="mt-8 scroll-mt-6 rounded-2xl border border-[#f0e5d8] bg-white p-5 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4b]">
                Profile editor
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {editingId ? `Edit ${form.name || 'cat profile'}` : 'Add a new cat'}
              </h2>
              <p className="mt-2 text-sm text-[#827366]">
                Fields marked with * are required.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={startNewCat}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-[#827366] hover:bg-[#fffaf3]"
              >
                <X size={16} />
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="mt-7 space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm font-semibold">
                Cat's name *
                <input
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e8ddd1] px-4 py-3 font-normal outline-none focus:border-[#e56c4b]"
                  placeholder="e.g. Mochi"
                />
              </label>

              <label className="block text-sm font-semibold">
                Age *
                <input
                  required
                  maxLength={40}
                  value={form.age_label}
                  onChange={(event) => updateField('age_label', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e8ddd1] px-4 py-3 font-normal outline-none focus:border-[#e56c4b]"
                  placeholder="e.g. 5 months"
                />
              </label>

              <label className="block text-sm font-semibold">
                Gender *
                <select
                  value={form.gender}
                  onChange={(event) =>
                    updateField('gender', event.target.value as CatForm['gender'])
                  }
                  className="mt-2 w-full rounded-xl border border-[#e8ddd1] bg-white px-4 py-3 font-normal outline-none focus:border-[#e56c4b]"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="Girl">Girl</option>
                  <option value="Boy">Boy</option>
                </select>
              </label>

              <label className="block text-sm font-semibold">
                Rescue area *
                <input
                  required
                  maxLength={120}
                  value={form.area}
                  onChange={(event) => updateField('area', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e8ddd1] px-4 py-3 font-normal outline-none focus:border-[#e56c4b]"
                  placeholder="e.g. Andheri West"
                />
              </label>

              <label className="block text-sm font-semibold">
                Personality *
                <input
                  required
                  maxLength={120}
                  value={form.personality}
                  onChange={(event) => updateField('personality', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e8ddd1] px-4 py-3 font-normal outline-none focus:border-[#e56c4b]"
                  placeholder="e.g. Professional napper"
                />
              </label>

              <label className="block text-sm font-semibold">
                Rescue / adoption status *
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField('status', event.target.value as CatStatus)
                  }
                  className="mt-2 w-full rounded-xl border border-[#e8ddd1] bg-white px-4 py-3 font-normal outline-none focus:border-[#e56c4b]"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-semibold">
              Description *
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                className="mt-2 w-full resize-y rounded-xl border border-[#e8ddd1] px-4 py-3 font-normal leading-6 outline-none focus:border-[#e56c4b]"
                placeholder="Tell potential adopters about this cat, their needs and their personality..."
              />
            </label>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold">
                  Cat photo
                </label>
                <p className="mt-1 text-xs leading-5 text-[#827366]">
                  Choose a JPG, PNG, WebP or other image supported by your bucket.
                  Uploads go to Supabase Storage.
                </p>
                <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e8cdbf] bg-[#fffaf6] px-4 py-5 text-center transition hover:border-[#e56c4b]">
                  <ImagePlus size={25} className="text-[#e56c4b]" />
                  <span className="text-sm font-bold">
                    {photoFile ? 'Choose a different photo' : 'Choose a photo'}
                  </span>
                  <span className="max-w-full break-all text-xs text-[#827366]">
                    {photoFile
                      ? photoFile.name
                      : editingId && cats.find((cat) => cat.id === editingId)?.photo_url
                        ? 'Current photo will be kept unless replaced'
                        : 'No photo selected'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.size > 5 * 1024 * 1024) {
                        setError('Please choose an image smaller than 5 MB.');
                        event.target.value = '';
                        return;
                      }
                      setError('');
                      setPhotoFile(file);
                    }}
                  />
                </label>
                {photoFile && (
                  <button
                    type="button"
                    onClick={() => setPhotoFile(null)}
                    className="mt-2 text-xs font-semibold text-[#a65d43] underline"
                  >
                    Remove selected photo
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-[#f0e5d8] bg-[#fffdf9] p-5">
                <p className="text-sm font-bold">Listing visibility</p>
                <p className="mt-1 text-xs leading-5 text-[#827366]">
                  Published cats with the status “Available for adoption” can
                  appear on the public adoption page. Other statuses stay out
                  of the public available listings.
                </p>
                <label className="mt-4 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(event) =>
                      updateField('is_published', event.target.checked)
                    }
                    className="h-4 w-4 accent-[#e56c4b]"
                  />
                  <span className="text-sm font-semibold">
                    Publish this cat's profile
                  </span>
                </label>
                <p className="mt-2 text-xs text-[#827366]">
                  New profiles start unpublished so you can review them first.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#f0e5d8] pt-5 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e56c4b] px-6 py-3 font-bold text-white transition hover:bg-[#cf5739] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving
                  ? 'Saving profile...'
                  : editingId
                    ? 'Save changes'
                    : 'Add cat profile'}
              </button>

              <button
                type="button"
                onClick={startNewCat}
                className="rounded-xl border border-[#e8ddd1] px-6 py-3 text-sm font-bold transition hover:bg-[#fffaf3]"
              >
                Clear form
              </button>
            </div>
          </form>
        </section>

        <footer className="py-8 text-center text-xs text-[#a18e7d]">
          Purrfect Match · Every cat deserves a safe place to call home.
        </footer>
      </div>
    </main>
  );
}
