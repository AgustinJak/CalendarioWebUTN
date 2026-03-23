"use client";

import { useState } from "react";
import { COURSES } from "@/lib/schedule";
import { INFOGRAFIAS, type Infografia } from "@/lib/infograficas";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const courseMap = new Map(COURSES.map((c) => [c.id, c]));

// ─── Modal ────────────────────────────────────────────────────────────────────

function InfografiaModal({
  item,
  onClose,
}: {
  item: Infografia;
  onClose: () => void;
}) {
  const course = courseMap.get(item.courseId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl"
        style={{ width: "90vw", height: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {course && (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: course.color }}
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {item.titulo}
              </div>
              <div className="text-xs text-white/50">
                {course?.name} · Unidad {item.unidad} · {item.año}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            Cerrar ✕
          </button>
        </div>

        {/* iframe */}
        <iframe
          src={`/infografia/${item.archivo}`}
          title={item.titulo}
          className="h-full w-full flex-1"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

// ─── Card de infografía ────────────────────────────────────────────────────────

function InfografiaCard({
  item,
  onOpen,
}: {
  item: Infografia;
  onOpen: (item: Infografia) => void;
}) {
  const course = courseMap.get(item.courseId);

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:bg-white/8">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {course && (
            <span
              className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: course.color }}
              aria-hidden="true"
            />
          )}
          <span className="text-xs font-medium text-white/60">
            {course?.name ?? item.courseId}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-[11px] text-white/50">
          U{item.unidad}
        </span>
      </div>

      {/* Title */}
      <div className="mt-2 text-sm font-semibold leading-snug text-white">
        {item.titulo}
      </div>

      {/* Description */}
      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/55">
        {item.descripcion}
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-white/35">{item.año}</span>
        <Button
          type="button"
          tone="accent"
          variant="soft"
          onClick={() => onOpen(item)}
        >
          Ver infografía
        </Button>
      </div>
    </div>
  );
}

// ─── Panel principal ───────────────────────────────────────────────────────────

export default function InfograficasPanel() {
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  const [open, setOpen] = useState<Infografia | null>(null);

  const visible = filterCourse
    ? INFOGRAFIAS.filter((i) => i.courseId === filterCourse)
    : INFOGRAFIAS;

  // Solo mostrar filtros para materias que tienen al menos 1 infografía
  const coursesWithItems = COURSES.filter((c) =>
    INFOGRAFIAS.some((i) => i.courseId === c.id)
  );

  return (
    <>
      <Card id="infografias">
        <CardHeader
          title="Biblioteca de Infografías"
          subtitle="Resúmenes visuales de clases, generados con IA"
          right={
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/60">
              {INFOGRAFIAS.length} infografía{INFOGRAFIAS.length !== 1 ? "s" : ""}
            </span>
          }
        />
        <CardBody>
          {/* Filtros por materia */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterCourse(null)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filterCourse === null
                  ? "border-white/30 bg-white/15 text-white"
                  : "border-white/10 bg-white/6 text-white/55 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              Todas
            </button>
            {coursesWithItems.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setFilterCourse(filterCourse === c.id ? null : c.id)
                }
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                  filterCourse === c.id
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-white/10 bg-white/6 text-white/55 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.color }}
                  aria-hidden="true"
                />
                {c.name}
              </button>
            ))}
          </div>

          {/* Galería */}
          {visible.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <InfografiaCard key={item.id} item={item} onOpen={setOpen} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/6 p-6 text-center text-sm text-white/50">
              No hay infografías para esta materia todavía.
            </div>
          )}
        </CardBody>
      </Card>

      {open && (
        <InfografiaModal item={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
