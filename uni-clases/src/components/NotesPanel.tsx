"use client";

import { useEffect, useMemo, useState } from "react";
import { COURSES } from "@/lib/schedule";
import type { NoteRecord } from "@/lib/types";
import { deleteNote, listNotes, putNote } from "@/lib/idb";
import { randomId } from "@/lib/storage";
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

  const [authorName, setAuthorName] = useState("");
  const [courseId, setCourseId] = useState(COURSES[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);

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
    const trimmedTitle = title.trim() || `${courseLabel} · Apuntes`;

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
      await putNote(note);
      onToast({ title: "Apunte subido", description: trimmedTitle, kind: "ok" });
      setTitle("");
      setDetails("");
      setFile(null);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudo subir", description: msg, kind: "danger" });
    }
  }

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
                  />
                </div>
              </div>
              <div>
                <Label>Descripcion (opcional)</Label>
                <div className="mt-1">
                  <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tema, unidad, consejos..."
                  />
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
                <Button type="button" tone="accent" onClick={() => void onUpload()}>
                  Subir apunte
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => void refresh()}
                  aria-label="Recargar"
                >
                  Recargar
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Ultimos apuntes</div>
            <div className="mt-1 text-xs text-white/55">
              En este prototipo se guarda por dispositivo.
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Cargando...
                </div>
              ) : notes.length ? (
                notes.map((n) => {
                  const course = COURSES.find((c) => c.id === n.courseId);
                  return (
                    <div
                      key={n.id}
                      className="rounded-2xl border border-white/10 bg-white/6 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">
                            {n.title}
                          </div>
                          <div className="mt-1 text-xs text-white/60">
                            {course?.name ?? "Materia"} · {n.authorName}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
                            <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5">
                              {n.filename}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5">
                              {bytesLabel(n.size)}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            size="sm"
                            variant="soft"
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
                        <div className="mt-3 text-sm text-white/70">{n.details}</div>
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
