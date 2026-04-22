"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/session";

type Props = { mode: "new" | "edit"; teacherId?: string };

type Teacher = {
  id: string;
  name: string;
  subject: string;
  bio: string | null;
  photo: string | null;
  displayOrder: number;
  isVisible: boolean;
};

function authHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function TeacherProfileForm({ mode, teacherId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (mode !== "edit" || !teacherId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/teachers/${teacherId}`, {
      headers: authHeader(),
    });
    if (!res.ok) {
      setError("Could not load teacher");
      setLoading(false);
      return;
    }
    const { teacher } = (await res.json()) as { teacher: Teacher };
    setName(teacher.name);
    setSubject(teacher.subject);
    setBio(teacher.bio ?? "");
    setPhoto(teacher.photo ?? "");
    setDisplayOrder(teacher.displayOrder);
    setIsVisible(teacher.isVisible);
    setPreviewUrl(teacher.photo ?? null);
    setLoading(false);
  }, [mode, teacherId]);

  useEffect(() => {
    void load();
  }, [load]);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) {
      setPendingFile(null);
      setPreviewUrl(photo || null);
      return;
    }
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  useEffect(
    () => () => {
      if (pendingFile && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [pendingFile, previewUrl],
  );

  async function uploadToCloudinary(file: File): Promise<string | null> {
    const token = getAuthToken();
    if (!token) return null;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/teachers/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { url?: string };
    return json.url ?? null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !subject.trim()) {
      setError("Name and subject are required.");
      return;
    }

    setSaving(true);
    let photoUrl = photo.trim();
    if (pendingFile) {
      const uploaded = await uploadToCloudinary(pendingFile);
      if (uploaded) photoUrl = uploaded;
    }

    const body = {
      name: name.trim(),
      subject: subject.trim(),
      bio: bio.trim(),
      photo: photoUrl || null,
      displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
      isVisible,
    };

    const endpoint =
      mode === "new" ? "/api/admin/teachers" : `/api/admin/teachers/${teacherId}`;
    const method = mode === "new" ? "POST" : "PUT";
    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error || "Save failed");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/admin/teachers");
  }

  if (mode === "edit" && loading) {
    return <p className="text-sm text-neutral-500">Loading teacher...</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/teachers"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to teachers
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">
          {mode === "new" ? "Add teacher profile" : "Edit teacher profile"}
        </h1>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Name
          </label>
          <input
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Subject
          </label>
          <input
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Bio
          </label>
          <textarea
            className="min-h-[6rem] w-full rounded-lg border border-neutral-200 px-3 py-2.5"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Photo (Cloudinary URL)
          </label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="text-sm"
            />
            <input
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
              placeholder="https://..."
              value={photo}
              onChange={(e) => {
                setPhoto(e.target.value);
                if (!pendingFile) setPreviewUrl(e.target.value || null);
              }}
            />
            {previewUrl ? (
              <div className="h-24 w-24 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                <Image
                  src={previewUrl}
                  alt={name || "Teacher photo"}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Display order
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2.5"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value || "0", 10))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 sm:pt-7">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
            />
            Visible on landing page
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
