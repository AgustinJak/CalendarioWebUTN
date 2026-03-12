export type SharedPostType = "note" | "file";

export type SharedPost = {
  id: string;
  created_at: string; // ISO
  type: SharedPostType;
  author_name: string;

  // Notes
  content?: string | null;

  // Files / shared "apuntes"
  course_id?: string | null;
  title?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;

  report_count: number;
  hidden: boolean;
  hidden_at?: string | null;
};

