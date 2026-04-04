"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addLesson,
  deleteCourse,
  importPublishedCourseToLocalStore,
  listCourses,
  unlockNextLesson,
  type CourseRecord,
} from "@/lib/courses-store";
import { getAuthToken } from "@/lib/session";
import { uploadLessonVideoToCloudinary } from "@/lib/cloudinary-upload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";

function newDraftId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

type LessonDraft = {
  id: string;
  title: string;
  description: string;
  /** Cloudinary `secure_url` or any hosted URL (stored as lesson video_url). */
  videoUrl: string;
  videoFile: File | null;
  uploadStatus: "idle" | "uploading" | "done" | "error";
  uploadProgress: number;
  uploadError?: string;
};

function emptyLessonDraft(): LessonDraft {
  return {
    id: newDraftId(),
    title: "",
    description: "",
    videoUrl: "",
    videoFile: null,
    uploadStatus: "idle",
    uploadProgress: 0,
  };
}

type ApiCourseCard = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_path: string | null;
  lesson_count: number;
  is_published?: boolean;
  fromApi: boolean;
};

function buildLocalCourseCards(): ApiCourseCard[] {
  return listCourses().map((c) => ({
    id: c.id,
    title: c.name,
    description: c.description ?? null,
    thumbnail_path: c.thumbnailUrl ?? null,
    lesson_count: c.lessons.length,
    is_published: true,
    fromApi: false,
  }));
}

export function AdminCoursesPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    null,
  );
  const [lessonDrafts, setLessonDrafts] = useState<LessonDraft[]>([
    emptyLessonDraft(),
  ]);
  const [publishBusy, setPublishBusy] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonUrl, setLessonUrl] = useState("");
  const [lessonVideoUploading, setLessonVideoUploading] = useState(false);
  const [lessonVideoProgress, setLessonVideoProgress] = useState(0);
  const [lessonVideoUploadError, setLessonVideoUploadError] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [courseCards, setCourseCards] = useState<ApiCourseCard[]>([]);
  const [courseCardsLoading, setCourseCardsLoading] = useState(true);
  const [usedApiCourseList, setUsedApiCourseList] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ApiCourseCard | null>(
    null,
  );
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editThumbnailPath, setEditThumbnailPath] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [editBusy, setEditBusy] = useState(false);

  const refresh = useCallback(() => {
    const list = listCourses();
    setCourses(list);
    setSelectedId((id) =>
      id && list.some((c) => c.id === id) ? id : "",
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadCourseCards = useCallback(async () => {
    setCourseCardsLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch("/api/courses", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setCourseCards(buildLocalCourseCards());
        setUsedApiCourseList(false);
        refresh();
        return;
      }
      const j = (await res.json()) as {
        courses?: Array<{
          id: string;
          title: string;
          description: string | null;
          thumbnail_path: string | null;
          lesson_count: number;
          is_published?: boolean;
        }>;
      };
      const list = j.courses ?? [];
      setCourseCards(
        list.map((c) => ({
          ...c,
          fromApi: true,
        })),
      );
      setUsedApiCourseList(true);
    } catch {
      setCourseCards(buildLocalCourseCards());
      setUsedApiCourseList(false);
      refresh();
    } finally {
      setCourseCardsLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    void loadCourseCards();
  }, [loadCourseCards]);

  useEffect(() => {
    if (!publishSuccess) return;
    const timer = setTimeout(() => setPublishSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [publishSuccess]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const selected = courses.find((c) => c.id === selectedId) ?? null;

  function openCreateModal() {
    setError(null);
    setPublishSuccess(null);
    setModalName("");
    setModalDescription("");
    setThumbnailFile(null);
    if (thumbnailPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(null);
    setLessonDrafts([emptyLessonDraft()]);
    setCreateOpen(true);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setModalName("");
    setModalDescription("");
    setThumbnailFile(null);
    if (thumbnailPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(null);
    setLessonDrafts([emptyLessonDraft()]);
  }

  function onThumbnailFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (thumbnailPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    if (!f) {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      return;
    }
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  }

  function lessonLabel(index: number) {
    if (index === 0) return t("admin_lesson_label_intro");
    return t("admin_lesson_label_number").replace("{{n}}", String(index));
  }

  function updateDraft(
    id: string,
    patch: Partial<Omit<LessonDraft, "id">>,
  ) {
    setLessonDrafts((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  async function onLessonVideoFileChange(
    id: string,
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const input = e.target;
    const f = input.files?.[0] ?? null;
    input.value = "";
    if (!f) {
      updateDraft(id, {
        videoFile: null,
        uploadStatus: "idle",
        uploadProgress: 0,
        uploadError: undefined,
      });
      return;
    }

    updateDraft(id, {
      videoFile: f,
      uploadStatus: "uploading",
      uploadProgress: 0,
      uploadError: undefined,
      videoUrl: "",
    });

    try {
      const url = await uploadLessonVideoToCloudinary(f, (pct) => {
        setLessonDrafts((rows) =>
          rows.map((r) =>
            r.id === id ? { ...r, uploadProgress: pct } : r,
          ),
        );
      });
      setLessonDrafts((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                videoUrl: url,
                videoFile: null,
                uploadStatus: "done",
                uploadProgress: 100,
                uploadError: undefined,
              }
            : r,
        ),
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("admin_course_publish_failed");
      setLessonDrafts((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                uploadStatus: "error",
                uploadError: msg,
                uploadProgress: 0,
              }
            : r,
        ),
      );
    }
  }

  async function handlePublishCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const title = modalName.trim();
    if (!title) {
      setError(t("admin_course_name_required"));
      return;
    }

    if (lessonDrafts.some((d) => d.uploadStatus === "uploading")) {
      setError(t("admin_video_uploading"));
      return;
    }

    for (let i = 0; i < lessonDrafts.length; i++) {
      const d = lessonDrafts[i];
      const hasVideo = Boolean(d.videoUrl.trim());
      const hasTitle = Boolean(d.title.trim());
      const rowEmpty = !hasTitle && !hasVideo && !d.description.trim();
      if (rowEmpty) continue;
      if (!hasTitle || !hasVideo) {
        setError(
          t("admin_course_lesson_incomplete").replace(
            "{{label}}",
            lessonLabel(i),
          ),
        );
        return;
      }
    }

    const toPublish = lessonDrafts.filter((d) => {
      const hasVideo = Boolean(d.videoUrl.trim());
      return d.title.trim() && hasVideo;
    });

    if (toPublish.length === 0) {
      setError(t("admin_course_at_least_one_lesson"));
      return;
    }

    setPublishBusy(true);
    try {
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        try {
          thumbnailUrl = await readFileAsDataURL(thumbnailFile);
        } catch {
          setError(t("admin_file_read_error"));
          return;
        }
      }

      const token = getAuthToken();
      if (!token) {
        setError(t("admin_session_required"));
        return;
      }

      const res = await fetch("/api/admin/courses/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: modalDescription.trim() || null,
          thumbnail_path: thumbnailUrl ?? null,
          lessons: toPublish.map((d, i) => ({
            title: d.title.trim(),
            description: d.description.trim() || null,
            video_url: d.videoUrl.trim(),
            order: i,
          })),
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        course?: {
          id: string;
          title: string;
          description: string | null;
          thumbnail_path: string | null;
          lessons: Array<{
            id: string;
            title: string;
            description: string | null;
            video_url: string;
            sort_order: number;
          }>;
        };
      };

      if (!res.ok) {
        if (res.status === 503) {
          setError(t("admin_course_db_required"));
        } else {
          setError(json.error ?? t("admin_course_publish_failed"));
        }
        return;
      }

      if (!json.course?.id || !Array.isArray(json.course.lessons)) {
        setError(t("admin_course_publish_failed"));
        return;
      }

      importPublishedCourseToLocalStore({
        courseId: json.course.id,
        title: json.course.title,
        description: json.course.description,
        thumbnail_path: json.course.thumbnail_path,
        lessons: json.course.lessons,
      });

      setPublishSuccess(t("admin_course_created_success"));
      closeCreateModal();
      refresh();
      setSelectedId(json.course.id);
      void loadCourseCards();
    } finally {
      setPublishBusy(false);
    }
  }

  async function onInlineLessonVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const f = input.files?.[0];
    input.value = "";
    if (!f) return;
    setLessonVideoUploadError(null);
    setLessonVideoUploading(true);
    setLessonVideoProgress(0);
    try {
      const url = await uploadLessonVideoToCloudinary(f, setLessonVideoProgress);
      setLessonUrl(url);
    } catch (err) {
      setLessonVideoUploadError(
        err instanceof Error ? err.message : t("admin_course_publish_failed"),
      );
    } finally {
      setLessonVideoUploading(false);
    }
  }

  function handleAddLesson(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedId) {
      setError(t("admin_course_pick_first"));
      return;
    }
    if (lessonVideoUploading) {
      setError(t("admin_video_uploading"));
      return;
    }
    const title = lessonTitle.trim();
    const url = lessonUrl.trim();
    if (!title) {
      setError(t("admin_lesson_title_required"));
      return;
    }
    if (!url) {
      setError(t("admin_lesson_url_required"));
      return;
    }
    addLesson(selectedId, title, url);
    setLessonTitle("");
    setLessonUrl("");
    setLessonVideoProgress(0);
    setLessonVideoUploadError(null);
    refresh();
  }

  function handleUnlockNext() {
    if (!selectedId) return;
    unlockNextLesson(selectedId);
    refresh();
  }

  const canUnlock =
    selected &&
    selected.lessons.length > 0 &&
    selected.unlockedThroughLesson < selected.lessons.length;

  function lessonsBlurb(count: number) {
    return t("admin_course_lessons_blurb").replace("{{n}}", String(count));
  }

  async function hydrateCourseFromServer(courseId: string) {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const j = (await res.json()) as {
      course: {
        id: string;
        title: string;
        description: string | null;
        thumbnail_path: string | null;
      };
      lessons: Array<{
        id: string;
        title: string;
        description: string | null;
        video_url: string;
        sort_order: number;
      }>;
    };
    importPublishedCourseToLocalStore({
      courseId: j.course.id,
      title: j.course.title,
      description: j.course.description,
      thumbnail_path: j.course.thumbnail_path,
      lessons: j.lessons,
    });
    refresh();
  }

  async function handleSelectCourseCard(c: ApiCourseCard) {
    setError(null);
    setSelectedId(c.id);
    if (c.fromApi) {
      await hydrateCourseFromServer(c.id);
    } else {
      refresh();
    }
  }

  function openEditCourse(c: ApiCourseCard) {
    setEditingCourse(c);
    setEditTitle(c.title);
    setEditDescription(c.description ?? "");
    setEditThumbnailPath(c.thumbnail_path ?? "");
    setEditPublished(c.is_published !== false);
  }

  function closeEditCourse() {
    setEditingCourse(null);
    setEditBusy(false);
  }

  async function handleSaveEditCourse(e: FormEvent) {
    e.preventDefault();
    if (!editingCourse) return;
    const token = getAuthToken();
    if (!token) {
      setError(t("admin_session_required"));
      return;
    }
    setEditBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          thumbnail_path: editThumbnailPath.trim() || null,
          is_published: editPublished,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? t("admin_course_publish_failed"));
        return;
      }
      await hydrateCourseFromServer(editingCourse.id);
      closeEditCourse();
      await loadCourseCards();
    } finally {
      setEditBusy(false);
    }
  }

  async function handleDeleteCourse(c: ApiCourseCard) {
    if (!window.confirm(t("admin_course_delete_confirm"))) return;
    if (!c.fromApi) {
      deleteCourse(c.id);
      refresh();
      void loadCourseCards();
      if (selectedId === c.id) setSelectedId("");
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setError(t("admin_session_required"));
      return;
    }
    const res = await fetch(`/api/admin/courses/${c.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? t("admin_course_publish_failed"));
      return;
    }
    deleteCourse(c.id);
    if (selectedId === c.id) setSelectedId("");
    refresh();
    void loadCourseCards();
  }

  const courseSelectOptions = useMemo(() => {
    if (courseCards.length > 0) {
      return courseCards.map((c) => ({ id: c.id, name: c.title }));
    }
    return courses.map((c) => ({ id: c.id, name: c.name }));
  }, [courseCards, courses]);

  return (
    <div className="space-y-10">
      {error && !createOpen ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      {publishSuccess ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          role="status"
        >
          {publishSuccess}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("admin_nav_courses")}
          </h1>
          <p className="mt-1 text-neutral-600">{t("admin_courses_sub")}</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-white"
        >
          {t("admin_courses_create")}
        </button>
      </div>

      {courseCardsLoading ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white py-12 text-center text-neutral-500">
          {t("admin_courses_loading")}
        </p>
      ) : courseCards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white py-12 text-center text-neutral-500">
          {t("admin_courses_empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courseCards.map((c) => {
            const initial = c.title.trim().slice(0, 1).toUpperCase() || "?";
            return (
              <div
                key={c.id}
                className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition duration-200 ${
                  selectedId === c.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => void handleSelectCourseCard(c)}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-safe:hover:bg-neutral-50/80"
                >
                  <div className="aspect-video w-full overflow-hidden bg-neutral-100">
                    {c.thumbnail_path ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs / data URLs
                      <img
                        src={c.thumbnail_path}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 text-4xl font-bold text-white">
                        {initial}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-foreground">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-neutral-600">
                      {lessonsBlurb(c.lesson_count)}
                    </p>
                    {usedApiCourseList && c.is_published === false ? (
                      <p className="mt-1 text-xs font-semibold uppercase text-amber-700">
                        {t("admin_course_draft_badge")}
                      </p>
                    ) : null}
                  </div>
                </button>
                <div
                  className="flex flex-wrap gap-2 border-t border-neutral-100 bg-neutral-50/90 px-3 py-3"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {c.fromApi ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 flex-1 text-sm sm:flex-none"
                        onClick={() => openEditCourse(c)}
                      >
                        {t("admin_course_edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-11 flex-1 text-sm sm:flex-none"
                        onClick={() => void handleDeleteCourse(c)}
                      >
                        {t("admin_course_delete")}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-11 text-sm"
                      onClick={() => void handleDeleteCourse(c)}
                    >
                      {t("admin_course_delete")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingCourse ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg p-6 shadow-2xl sm:p-8">
            <h2 className="text-xl font-bold text-foreground">
              {t("admin_course_edit")}
            </h2>
            <form onSubmit={handleSaveEditCourse} className="mt-6 space-y-4">
              <label className="block text-left text-sm font-medium text-neutral-700">
                <span className="mb-2 block">{t("admin_course_title_label")}</span>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                />
              </label>
              <label className="block text-left text-sm font-medium text-neutral-700">
                <span className="mb-2 block">
                  {t("admin_course_description_label")}
                </span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                />
              </label>
              <label className="block text-left text-sm font-medium text-neutral-700">
                <span className="mb-2 block">
                  {t("admin_course_thumbnail_path_label")}
                </span>
                <input
                  type="text"
                  value={editThumbnailPath}
                  onChange={(e) => setEditThumbnailPath(e.target.value)}
                  placeholder="https://..."
                  className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-left text-sm font-medium">
                <input
                  type="checkbox"
                  checked={editPublished}
                  onChange={(e) => setEditPublished(e.target.checked)}
                  className="h-5 w-5"
                />
                {t("admin_course_published_label")}
              </label>
              {error && editingCourse ? (
                <p className="text-sm text-accent" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={editBusy}
                  className="min-h-12 flex-1"
                >
                  {editBusy ? "…" : t("admin_course_save")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    closeEditCourse();
                  }}
                  className="min-h-12 flex-1"
                >
                  {t("back")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden p-0 shadow-2xl sm:max-w-2xl">
            <div className="max-h-[90vh] overflow-y-auto p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                {t("admin_course_modal_heading")}
              </h2>
              <form onSubmit={handlePublishCourse} className="mt-6 space-y-8">
                {error ? (
                  <p className="text-sm text-accent" role="alert">
                    {error}
                  </p>
                ) : null}

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                    {t("admin_course_details_section")}
                  </h3>
                  <label className="block text-left text-sm font-medium text-neutral-700">
                    <span className="mb-2 block">
                      {t("admin_course_title_label")}
                    </span>
                    <input
                      type="text"
                      value={modalName}
                      onChange={(e) => {
                        setModalName(e.target.value);
                        if (error) setError(null);
                      }}
                      className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                    />
                  </label>
                  <label className="block text-left text-sm font-medium text-neutral-700">
                    <span className="mb-2 block">
                      {t("admin_course_description_label")}
                    </span>
                    <textarea
                      value={modalDescription}
                      onChange={(e) => setModalDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                    />
                  </label>
                  <div className="block text-left text-sm font-medium text-neutral-700">
                    <span className="mb-2 block">
                      {t("admin_course_thumbnail_upload")}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onThumbnailFileChange}
                      className="min-h-12 w-full rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-base file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:text-white"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      {t("admin_course_thumbnail_hint")}
                    </p>
                    {thumbnailPreview ? (
                      <div className="mt-3 aspect-video max-h-40 w-full max-w-xs overflow-hidden rounded-xl border border-neutral-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailPreview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                    {t("admin_lessons_section")}
                  </h3>
                  <div className="space-y-6">
                    {lessonDrafts.map((d, index) => (
                      <div
                        key={d.id}
                        className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5"
                      >
                        <p className="mb-4 text-sm font-bold text-primary">
                          {lessonLabel(index)}
                        </p>
                        <div className="space-y-3">
                          <label className="block text-left text-sm font-medium text-neutral-700">
                            <span className="mb-2 block">
                              {t("admin_lesson_title_label")}
                            </span>
                            <input
                              type="text"
                              value={d.title}
                              onChange={(e) =>
                                updateDraft(d.id, { title: e.target.value })
                              }
                              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                            />
                          </label>
                          <label className="block text-left text-sm font-medium text-neutral-700">
                            <span className="mb-2 block">
                              {t("admin_lesson_description_label")}
                            </span>
                            <textarea
                              value={d.description}
                              onChange={(e) =>
                                updateDraft(d.id, {
                                  description: e.target.value,
                                })
                              }
                              rows={2}
                              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                            />
                          </label>
                          <div className="block text-left text-sm font-medium text-neutral-700">
                            <span className="mb-2 block">
                              {t("admin_video_upload_label")}
                            </span>
                            <input
                              type="file"
                              accept="video/*"
                              disabled={d.uploadStatus === "uploading"}
                              onChange={(e) =>
                                void onLessonVideoFileChange(d.id, e)
                              }
                              className="min-h-12 w-full rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-2 text-base file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:text-white disabled:opacity-50"
                            />
                            {d.uploadStatus === "uploading" &&
                            d.videoFile ? (
                              <p className="mt-1 text-xs text-neutral-600">
                                {d.videoFile.name}
                              </p>
                            ) : null}
                            {d.uploadStatus === "uploading" ? (
                              <div className="mt-3 space-y-2">
                                <p className="text-sm font-medium text-primary">
                                  {t("admin_video_uploading")}
                                </p>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                                  <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-200"
                                    style={{
                                      width: `${d.uploadProgress}%`,
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-neutral-500">
                                  {t("admin_video_upload_progress").replace(
                                    "{{pct}}",
                                    String(d.uploadProgress),
                                  )}
                                </p>
                              </div>
                            ) : null}
                            {d.videoUrl.trim().startsWith("https://") &&
                            d.uploadStatus !== "uploading" ? (
                              <div className="mt-3 space-y-2">
                                {d.uploadStatus === "done" ? (
                                  <p className="text-sm font-medium text-emerald-700">
                                    {t("admin_video_upload_success")}
                                  </p>
                                ) : null}
                                <p className="text-xs text-neutral-500">
                                  {t("admin_video_preview")}
                                </p>
                                <video
                                  src={d.videoUrl}
                                  controls
                                  className="max-h-52 w-full rounded-xl border border-neutral-200 bg-black"
                                />
                              </div>
                            ) : null}
                            {d.uploadStatus === "error" && d.uploadError ? (
                              <p className="mt-2 text-sm text-accent">
                                {d.uploadError}
                              </p>
                            ) : null}
                          </div>
                          <label className="block text-left text-sm font-medium text-neutral-700">
                            <span className="mb-2 block">
                              {t("admin_video_url_optional")}
                            </span>
                            <input
                              type="url"
                              placeholder="https://..."
                              value={d.videoUrl}
                              onChange={(e) =>
                                updateDraft(d.id, {
                                  videoUrl: e.target.value,
                                  uploadStatus: "idle",
                                  uploadError: undefined,
                                })
                              }
                              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setLessonDrafts((rows) => [...rows, emptyLessonDraft()])
                    }
                    className="min-h-12 w-full sm:w-auto"
                  >
                    {t("admin_add_lesson_block")}
                  </Button>
                </section>

                <div className="flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={
                      publishBusy ||
                      lessonDrafts.some((d) => d.uploadStatus === "uploading")
                    }
                    className="min-h-14 flex-1 text-lg"
                  >
                    {publishBusy ? "…" : t("admin_course_publish")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      closeCreateModal();
                    }}
                    className="min-h-14 flex-1 text-lg"
                  >
                    {t("back")}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      ) : null}

      <Card className="p-6 shadow-md sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("admin_lesson_add_heading")}
        </h2>
        <div className="mb-4">
          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">{t("admin_select_course")}</span>
            <select
              value={selectedId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedId(id);
                setError(null);
                const card = courseCards.find((x) => x.id === id);
                if (card?.fromApi) {
                  void hydrateCourseFromServer(id);
                }
              }}
              className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
            >
              <option value="">{t("admin_course_select_placeholder")}</option>
              {courseSelectOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedId ? (
          <form onSubmit={handleAddLesson} className="flex flex-col gap-4">
            <label className="block text-left text-sm font-medium text-neutral-700">
              <span className="mb-2 block">{t("admin_lesson_title_label")}</span>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => {
                  setLessonTitle(e.target.value);
                  if (error) setError(null);
                }}
                className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
              />
            </label>
            <div className="block text-left text-sm font-medium text-neutral-700">
              <span className="mb-2 block">{t("admin_video_upload_label")}</span>
              <input
                type="file"
                accept="video/*"
                disabled={lessonVideoUploading}
                onChange={(e) => void onInlineLessonVideoChange(e)}
                className="min-h-12 w-full rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-2 text-base file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:text-white disabled:opacity-50"
              />
              {lessonVideoUploading ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-primary">
                    {t("admin_video_uploading")}
                  </p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${lessonVideoProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    {t("admin_video_upload_progress").replace(
                      "{{pct}}",
                      String(lessonVideoProgress),
                    )}
                  </p>
                </div>
              ) : null}
              {lessonVideoUploadError ? (
                <p className="mt-2 text-sm text-accent">
                  {lessonVideoUploadError}
                </p>
              ) : null}
              {!lessonVideoUploading &&
              lessonUrl.trim().startsWith("https://") ? (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-emerald-700">
                    {t("admin_video_upload_success")}
                  </p>
                  <video
                    src={lessonUrl}
                    controls
                    className="max-h-48 w-full rounded-xl border border-neutral-200 bg-black"
                  />
                </div>
              ) : null}
            </div>
            <label className="block text-left text-sm font-medium text-neutral-700">
              <span className="mb-2 block">{t("admin_lesson_url_label")}</span>
              <input
                type="url"
                placeholder="https://..."
                value={lessonUrl}
                onChange={(e) => {
                  setLessonUrl(e.target.value);
                  setLessonVideoUploadError(null);
                  if (error) setError(null);
                }}
                className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
              />
            </label>
            <Button
              type="submit"
              className="min-h-14"
              disabled={lessonVideoUploading}
            >
              {t("admin_add_lesson")}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-neutral-500">{t("admin_course_pick_first")}</p>
        )}
      </Card>

      {selected && selected.lessons.length > 0 ? (
        <Card className="p-6 shadow-md sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            {selected.name}
          </h2>
          <ul className="space-y-3">
            {selected.lessons.map((lesson, index) => {
              const n = index + 1;
              const open = n <= selected.unlockedThroughLesson;
              return (
                <li key={lesson.id}>
                  <div className="flex min-h-14 flex-col gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">
                        {t("admin_lesson_prefix")} {n}: {lesson.title}
                      </span>
                      {lesson.description ? (
                        <p className="mt-1 text-sm text-neutral-600">
                          {lesson.description}
                        </p>
                      ) : null}
                    </div>
                    {open ? (
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 self-start rounded-lg p-2 text-2xl text-primary transition-colors hover:bg-primary/10 sm:self-center"
                        title={t("admin_open_video")}
                        aria-label={t("admin_open_video")}
                      >
                        ▶
                      </a>
                    ) : (
                      <span
                        className="shrink-0 self-start text-2xl sm:self-center"
                        aria-hidden
                      >
                        🔒
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8">
            <Button
              type="button"
              onClick={handleUnlockNext}
              disabled={!canUnlock}
              variant="outline"
              className="min-h-14 w-full"
            >
              {!canUnlock && selected
                ? t("admin_all_lessons_unlocked")
                : t("admin_unlock_next_lesson")}
            </Button>
          </div>
        </Card>
      ) : selected && selected.lessons.length === 0 ? (
        <Card className="p-8 text-center text-neutral-500 shadow-md">
          {t("admin_course_no_lessons_yet")}
        </Card>
      ) : null}
    </div>
  );
}
