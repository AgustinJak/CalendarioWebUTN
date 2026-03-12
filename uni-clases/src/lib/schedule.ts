import { addDays, dateKey, endOfMonth, startOfMonth, withTime } from "./date";
import type { Course, Session, WeeklySlot } from "./types";

export const COURSES: Course[] = [
  {
    id: "prog-1",
    name: "Programacion I",
    professor: "Gregorio Reche",
    liveUrl: "https://tup.utnba.centrodeelearning.com/course/view.php?id=44",
    color: "#ff6b6b",
  },
  {
    id: "arq-so",
    name: "Arquitectura y Sistemas Operativos",
    professor: "Edgardo Hugo Rego",
    liveUrl: "https://tup.utnba.centrodeelearning.com/course/view.php?id=45",
    color: "#62d2f7",
  },
  {
    id: "org-emp",
    name: "Organizacion empresarial",
    professor: "Judith Ghilino",
    liveUrl: "https://tup.utnba.centrodeelearning.com/course/view.php?id=47",
    color: "#f8b16b",
  },
  {
    id: "mate",
    name: "Matematica",
    professor: "Eduardo Paz",
    liveUrl: "https://tup.utnba.centrodeelearning.com/course/view.php?id=46",
    color: "#3ee6b5",
  },
];

// Cronograma semanal (se repite todas las semanas).
// Horario: 18:30 a 20:30 (todas las materias).
export const WEEKLY_SLOTS: WeeklySlot[] = [
  { courseId: "prog-1", weekday: 1, startTime: "18:30", durationMin: 120 }, // Lun
  { courseId: "arq-so", weekday: 2, startTime: "18:30", durationMin: 120 }, // Mar
  { courseId: "prog-1", weekday: 3, startTime: "18:30", durationMin: 120 }, // Mie
  { courseId: "org-emp", weekday: 4, startTime: "18:30", durationMin: 120 }, // Jue
  { courseId: "mate", weekday: 5, startTime: "18:30", durationMin: 120 }, // Vie
];

const courseById = new Map(COURSES.map((c) => [c.id, c]));

function sessionId(courseId: string, day: Date, startTime: string) {
  return `${courseId}-${dateKey(day)}-${startTime}`;
}

export function sessionsForRange(rangeStart: Date, rangeEnd: Date) {
  const sessions: Session[] = [];

  const dayStart = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate(),
    0,
    0,
    0,
    0,
  );

  for (let day = new Date(dayStart); day <= rangeEnd; day = addDays(day, 1)) {
    for (const slot of WEEKLY_SLOTS) {
      if (day.getDay() !== slot.weekday) continue;
      const course = courseById.get(slot.courseId);
      if (!course) continue;

      const start = withTime(day, slot.startTime);
      const end = new Date(start.getTime() + slot.durationMin * 60 * 1000);

      if (end < rangeStart || start > rangeEnd) continue;

      sessions.push({
        id: sessionId(slot.courseId, day, slot.startTime),
        courseId: slot.courseId,
        title: course.name,
        professor: course.professor,
        start,
        end,
        liveUrl: course.liveUrl,
        room: course.room,
        color: course.color,
      });
    }
  }

  sessions.sort((a, b) => a.start.getTime() - b.start.getTime());
  return sessions;
}

export function sessionsForMonth(anchor: Date) {
  return sessionsForRange(startOfMonth(anchor), endOfMonth(anchor));
}

export function getCourse(courseId: string) {
  return courseById.get(courseId);
}
