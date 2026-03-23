export type Infografia = {
  id: string;
  titulo: string;
  descripcion: string;
  courseId: string;
  unidad: number;
  año: number;
  archivo: string; // nombre del archivo dentro de /infografia/
};

export const INFOGRAFIAS: Infografia[] = [
  {
    id: "2026-arq-so-u1-evolucion-cpu",
    titulo: "Evolución del Procesamiento de CPU",
    descripcion:
      "Historia y evolución del procesamiento en CPU: desde los primeros sistemas de procesamiento en lote hasta las arquitecturas modernas.",
    courseId: "arq-so",
    unidad: 1,
    año: 2026,
    archivo: "2026-arq-so-u1-evolucion-cpu.html",
  },
  {
    id: "2026-arq-so-u1-tarjetas-perforadas",
    titulo: "Tarjetas Perforadas",
    descripcion:
      "Era del procesamiento en serie: historia, funcionamiento y legado de las tarjetas perforadas en la computación temprana.",
    courseId: "arq-so",
    unidad: 1,
    año: 2026,
    archivo: "2026-arq-so-u1-tarjetas-perforadas.html",
  },
  {
    id: "2026-arq-so-u2-procesos",
    titulo: "Tarjetas Perforadas",
    descripcion:
      "Introduccion a Procesos",
    courseId: "arq-so",
    unidad: 2,
    año: 2026,
    archivo: "2026-arq-so-u2-procesos.html",
  },
];
