"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** API endpoints — same pattern as your dashboard */
const TEACHER_API = "http://localhost:5002/api/teachers";
const FOLDERS_ADMIN_API = "http://localhost:5002/api/folders/admin";
const FOLDERS_BY_TEACHER_API = "http://localhost:5002/api/folders";

/** Types that match your previous UI */
type ActivityTypeId =
    | "interactive-video"
    | "multiple-choice"
    | "drag-and-drop"
    | "quiz"
    | "course-presentation"
    | "single-choice";

type ActivityType = {
  id: ActivityTypeId;
  name: string;
  version: string;
  description: string;
  usedIn: number;
  isEnabled: boolean;
};

type Share = { email: string; role: "view" | "edit" };
type FileMeta = { originalName: string; filename: string; uploadedAt?: string };
type Folder = {
  _id: string;
  name: string;
  teacherEmail: string;
  sharedWith: Share[];
  pdfs: FileMeta[];
  h5ps: FileMeta[];
};

const DEFAULT_TYPES: Omit<ActivityType, "usedIn">[] = [
  {
    id: "interactive-video",
    name: "Interactive Video",
    version: "1.22",
    description:
        "Add interactions like questions, links, and labels directly onto a video to make learning more engaging and active.",
    isEnabled: true,
  },
  {
    id: "multiple-choice",
    name: "Multiple Choice",
    version: "1.24",
    description:
        "Create quizzes with one or more correct answers, detailed feedback, and retry options — useful for checking understanding.",
    isEnabled: true,
  },
  {
    id: "drag-and-drop",
    name: "Drag and Drop",
    version: "1.12",
    description:
        "Let learners match or sort elements by dragging items into defined drop zones — ideal for visual and hands-on exercises.",
    isEnabled: true,
  },
  {
    id: "quiz",
    name: "Quiz",
    version: "1.22",
    description:
        "Combine multiple question types (e.g. MCQ, drag & drop, fill-in-the-blank) into one sequential quiz with scoring and feedback.",
    isEnabled: true,
  },
  {
    id: "course-presentation",
    name: "Course Presentation",
    version: "1.11",
    description:
        "Build interactive slide-based lessons with multimedia, quizzes, and navigation — perfect for structured content delivery.",
    isEnabled: false,
  },
  {
    id: "single-choice",
    name: "Single Choice",
    version: "1.9",
    description:
        "A simple quiz type where the learner selects only one correct answer from several options — quick and easy to create.",
    isEnabled: true,
  },
];

const STORAGE_KEY = "activityTypesState_v1";

/** filename -> best-guess H5P type */
function inferH5PTypeId(name: string): ActivityTypeId | null {
  const n = (name || "").toLowerCase();

  // common aliases people use in file names
  if (/\b(iv|interactive[-\s_]?video)\b/.test(n)) return "interactive-video";
  if (/\b(mcq|multiple[-\s_]?choice|single[-\s_]?choice)\b/.test(n)) {
    // prefer multiple-choice if both appear
    if (/\b(single[-\s_]?choice)\b/.test(n)) return "single-choice";
    return "multiple-choice";
  }
  if (/\b(drag[-\s_]?and[-\s_]?drop|dnd|dragdrop|drag[-\s_]?drop)\b/.test(n))
    return "drag-and-drop";
  if (/\b(course[-\s_]?presentation|slides?)\b/.test(n))
    return "course-presentation";
  if (/\b(quiz|test|assessment)\b/.test(n)) return "quiz";

  return null;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}

export default function ActivityTypesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // 1) Partial pour éviter TS2345 lors de l'init ({})
  const [typesMap, setTypesMap] = useState<
      Partial<Record<ActivityTypeId, boolean>>
  >({});
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // bootstrap toggles
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTypesMap(JSON.parse(raw) as Partial<Record<ActivityTypeId, boolean>>);
      } else {
        // 2) Construire un map typé sans `any`
        const initial = DEFAULT_TYPES.reduce<
            Partial<Record<ActivityTypeId, boolean>>
        >((acc, t) => {
          acc[t.id] = t.isEnabled;
          return acc;
        }, {});
        setTypesMap(initial);
      }
    } catch {
      // ignore
    }
  }, []);

  // persist toggles
  useEffect(() => {
    if (!Object.keys(typesMap).length) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(typesMap));
    } catch {
      // ignore
    }
  }, [typesMap]);

  // load folders from backend (admin endpoint or per teacher fallback)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const teachers: { email: string }[] = await fetchJson(TEACHER_API, {
          cache: "no-store",
        });

        let all: Folder[] | null = null;
        try {
          all = await fetchJson<Folder[]>(FOLDERS_ADMIN_API, {
            cache: "no-store",
          });
        } catch {
          const results = await Promise.allSettled(
              (teachers || []).map((t) =>
                  fetchJson<Folder[]>(FOLDERS_BY_TEACHER_API, {
                    cache: "no-store",
                    headers: { "x-teacher-email": t.email },
                  })
              )
          );
          const merged: Folder[] = [];
          for (const r of results) {
            if (r.status === "fulfilled" && Array.isArray(r.value))
              merged.push(...r.value);
          }
          all = merged;
        }

        setFolders(all || []);
      } catch (e: unknown) {
        const message =
            e instanceof Error ? e.message : "Failed to load content";
        setErr(message);
        setFolders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // compute usedIn from real H5Ps (filename inference)
  const types: ActivityType[] = useMemo(() => {
    const counts: Record<ActivityTypeId, number> = {
      "interactive-video": 0,
      "multiple-choice": 0,
      "drag-and-drop": 0,
      quiz: 0,
      "course-presentation": 0,
      "single-choice": 0,
    };
    for (const f of folders) {
      for (const h of f.h5ps || []) {
        const id = inferH5PTypeId(h.originalName || h.filename);
        if (id) counts[id] += 1;
      }
    }
    return DEFAULT_TYPES.map((t) => ({
      ...t,
      usedIn: counts[t.id],
      isEnabled: typesMap[t.id] ?? t.isEnabled,
    }));
  }, [folders, typesMap]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return types;
    return types.filter(
        (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.version.toLowerCase().includes(q)
    );
  }, [types, searchTerm]);

  const setToggle = (id: ActivityTypeId, v: boolean) =>
      setTypesMap((m) => ({ ...m, [id]: v }));

  // 3) Remplacer `as any` dans enable/disable all
  const buildMap = (value: boolean): Record<ActivityTypeId, boolean> =>
      DEFAULT_TYPES.reduce<Record<ActivityTypeId, boolean>>((acc, t) => {
        acc[t.id] = value;
        return acc;
      }, {} as Record<ActivityTypeId, boolean>);

  const enableAll = () => setTypesMap(buildMap(true));
  const disableAll = () => setTypesMap(buildMap(false));

  return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-2xl font-bold text-gray-800">Activity Types</div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
              />
              <Input
                  placeholder="Search activity types"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-72"
              />
            </div>
            <button
                onClick={enableAll}
                className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Enable all
            </button>
            <button
                onClick={disableAll}
                className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Disable all
            </button>
          </div>
        </div>

        {err && (
            <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-3">
              {err}
            </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Activity Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Used in
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Toggle
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                  <tr>
                    <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
              ) : filtered.length === 0 ? (
                  <tr>
                    <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                    >
                      No activity types.
                    </td>
                  </tr>
              ) : (
                  filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {a.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-500">
                            {a.version}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-extralight text-gray-400 max-w-md">
                            {a.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {a.usedIn} Content
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                              onClick={() => setToggle(a.id, !a.isEnabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                  a.isEnabled ? "bg-green-600" : "bg-gray-200"
                              }`}
                          >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                a.isEnabled ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                          </button>
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}