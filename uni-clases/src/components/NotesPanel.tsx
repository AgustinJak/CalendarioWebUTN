"use client";

import { useEffect, useMemo, useState } from "react";
import { COURSES } from "@/lib/schedule";
import type { NoteRecord } from "@/lib/types";
import { deleteNote, listNotes, putNote } from "@/lib/idb";
import { randomId } from "@/lib/storage";
import { loadSavedAuthorName, saveAuthorName } from "@/lib/prefs";
import Button from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Input, Label, Select, Textarea } from "./ui/Field";

function bytesLabel(bytes: number) {
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  if (kb >= 1) return `${kb.toFixed(0)} KB`;
  return `${bytes} B`;
}

const MAX_AUTHOR = 60;
const MAX_TITLE = 90;
const MAX_DESC = 600;

type SortMode = "new" | "old";

function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export default function NotesPanel({
  onToast,
}: {
  onToast: (t: {
    title: string;
    description?: string;
    kind?: "info" | "ok" | "warn" | "danger";
  }) => void;
}) {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [courseId, setCourseId] = useState(COURSES[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [q, setQ] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [sortMode, setSortMode] = useState<SortMode>("new");

  const courseLabel = useMemo(() => {
    const c = COURSES.find((x) => x.id === courseId);
    return c?.name ?? "Materia";
  }, [courseId]);

  async function refresh() {
    setLoading(true);
    try {
      const next = await listNotes();
      setNotes(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({
        title: "No se pudieron cargar apuntes",
        description: msg,
        kind: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const saved = loadSavedAuthorName();
    if (saved) setAuthorName((v) => v || saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUpload() {
    if (!file) {
      onToast({ title: "Subi un archivo primero", kind: "warn" });
      return;
    }
    const trimmedName = authorName.trim();
    if (!trimmedName) {
      onToast({ title: "Completa tu nombre y apellido", kind: "warn" });
      return;
    }
    if (trimmedName.length > MAX_AUTHOR) {
      onToast({ title: `Nombre demasiado largo (max ${MAX_AUTHOR}).`, kind: "warn" });
      return;
    }
    const trimmedTitle = title.trim() || `${courseLabel} · Apuntes`;
    if (trimmedTitle.length > MAX_TITLE) {
      onToast({ title: `Titulo demasiado largo (max ${MAX_TITLE}).`, kind: "warn" });
      return;
    }
    if (details.trim().length > MAX_DESC) {
      onToast({ title: `Descripcion demasiado larga (max ${MAX_DESC}).`, kind: "warn" });
      return;
    }

    const note: NoteRecord = {
      id: randomId("note"),
      createdAt: Date.now(),
      courseId,
      authorName: trimmedName,
      title: trimmedTitle,
      details: details.trim() || undefined,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      blob: file,
    };

    try {
      setUploading(true);
      saveAuthorName(trimmedName);
      await putNote(note);
      onToast({ title: "Apunte subido", description: trimmedTitle, kind: "ok" });
      setTitle("");
      setDetails("");
      setFile(null);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudo subir", description: msg, kind: "danger" });
    } finally {
      setUploading(false);
    }
  }

  const visibleNotes = useMemo(() => {
    const needle = q.trim();
    let arr = notes.slice();

    if (filterCourse) arr = arr.filter((x) => x.courseId === filterCourse);

    if (needle) {
      arr = arr.filter((x) => {
        const course = COURSES.find((c) => c.id === x.courseId);
        return (
          includesLoose(x.title ?? "", needle) ||
          includesLoose(x.authorName ?? "", needle) ||
          includesLoose(x.details ?? "", needle) ||
          includesLoose(course?.name ?? "", needle)
        );
      });
    }

    if (sortMode === "old") arr.sort((a, b) => a.createdAt - b.createdAt);
    else arr.sort((a, b) => b.createdAt - a.createdAt);

    return arr;
  }, [notes, q, filterCourse, sortMode]);

  return (
    <Card className="u-noise" id="apuntes">
      <CardHeader
        title="Apuntes"
        subtitle="Subi archivos (queda guardado en tu navegador por ahora)"
        right={
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
            {loading ? "Cargando..." : `${notes.length} item(s)`}
          </div>
        }
      />
      <CardBody>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3">
              <div>
                <Label>Nombre y apellido</Label>
                <div className="mt-1">
                  <Input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ej: Juan Perez"
                    maxLength={MAX_AUTHOR}
                  />
                </div>
              </div>
              <div>
                <Label>Materia</Label>
                <div className="mt-1">
                  <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    {COURSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Titulo</Label>
                <div className="mt-1">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${courseLabel} · Resumen / Parciales / Guia`}
                    maxLength={MAX_TITLE}
                  />
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                  {title.length}/{MAX_TITLE}
                </div>
              </div>
              <div>
                <Label>Descripcion (opcional)</Label>
                <div className="mt-1">
                  <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tema, unidad, consejos..."
                    maxLength={MAX_DESC}
                  />
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                  {details.length}/{MAX_DESC}
                </div>
              </div>
              <div>
                <Label>Archivo</Label>
                <div className="mt-1">
                  <input
                    className="block w-full rounded-xl border border-white/12 bg-white/6 p-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white/12 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/16"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
                  />
                  <div className="mt-2 text-xs text-white/55">
                    Consejo: PDF o imagen. Para multiusuario real, luego lo
                    conectamos a una DB.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" tone="accent" onClick={() => void onUpload()} disabled={uploading}>
                  {uploading ? "Subiendo..." : "Subir apunte"}
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => void refresh()}
                  aria-label="Recargar"
                  disabled={loading || uploading}
                >
                  {loading ? "Cargando..." : "Recargar"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Ultimos apuntes</div>
            <div className="mt-1 text-xs text-white/55">
              En este prototipo se guarda por dispositivo.
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por titulo, autor, materia..."
                className="h-10 text-sm"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="h-10 text-sm"
                  aria-label="Filtrar por materia"
                >
                  <option value="">Todas</option>
                  {COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="h-10 text-sm"
                  aria-label="Ordenar"
                >
                  <option value="new">Recientes</option>
                  <option value="old">Mas antiguos</option>
                </Select>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Cargando...
                </div>
              ) : visibleNotes.length ? (
                visibleNotes.map((n) => {
                  const course = COURSES.find((c) => c.id === n.courseId);
                  return (
                    <div
                      key={n.id}
                      className="rounded-2xl border border-white/10 bg-white/6 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">
                            {n.title}
                          </div>
                          <div className="mt-1 text-xs text-white/60">
                            {course?.name ?? "Materia"} · {n.authorName}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
                            <span className="inline-flex max-w-full items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-white/10 bg-white/6 px-2 py-0.5">
                              {n.filename}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5">
                              {bytesLabel(n.size)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:items-center sm:gap-2">
                          <Button
                            size="sm"
                            variant="soft"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              const url = URL.createObjectURL(n.blob);
                              window.open(url, "_blank", "noopener,noreferrer");
                              window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
                            }}
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            tone="danger"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              void (async () => {
                                const ok = window.confirm("Eliminar este apunte?");
                                if (!ok) return;
                                await deleteNote(n.id);
                                onToast({ title: "Apunte eliminado", kind: "info" });
                                await refresh();
                              })();
                            }}
                          >
                            Borrar
                          </Button>
                        </div>
                      </div>
                      {n.details ? (
                        <div className="mt-3 break-words text-sm text-white/70">{n.details}</div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Todavia no hay apuntes. Sube el primero para que el tablero se
                  vea completo.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
