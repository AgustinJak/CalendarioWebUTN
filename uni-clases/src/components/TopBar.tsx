import Button from "./ui/Button";

export default function TopBar({
  title = "Portal de Clases",
}: {
  title?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#071724]/55 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <div className="truncate font-serif text-[20px] tracking-tight text-white">
            {title}
          </div>
          <div className="mt-1 text-xs text-white/55">
            Horarios, alertas, apuntes y mensajes
          </div>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          <a
            href="#calendario"
            className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/6 hover:text-white"
          >
            Calendario
          </a>
          <a
            href="#apuntes"
            className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/6 hover:text-white"
          >
            Apuntes
          </a>
          <a
            href="#muro"
            className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/6 hover:text-white"
          >
            Muro
          </a>
          <a href="#calendario">
            <Button size="sm" variant="soft" tone="accent" type="button">
              Ver proximas clases
            </Button>
          </a>
        </nav>
      </div>
    </header>
  );
}

