export type Course = {
  id: string;
  name: string;
  professor: string;
  room?: string;
  liveUrl?: string;
  color: string; // CSS color, used for dots/badges
};

export type WeeklySlot = {
  courseId: string;
  weekday: number; // 0=Sun ... 6=Sat (JS Date)
  startTime: string; // "HH:MM" local
  durationMin: number;
};

export type Session = {
  id: string;
  courseId: string;
  title: string;
  professor: string;
  start: Date;
  end: Date;
  liveUrl?: string;
  room?: string;
  color: string;
};

export type ToastKind = "info" | "ok" | "warn" | "danger";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  kind: ToastKind;
  createdAt: number;
  actionLabel?: string;
  onAction?: () => void;
};

export type NoteRecord = {
  id: string;
  createdAt: number;
  courseId: string;
  authorName: string;
  title: string;
  details?: string;
  filename: string;
  mime: string;
  size: number;
  blob: Blob;
};

export type GuestMessage = {
  id: string;
  createdAt: number;
  authorName: string;
  message: string;
};
