const LS_AUTHOR = "uni_clases_author_name_v1";

export function loadSavedAuthorName() {
  if (typeof localStorage === "undefined") return "";
  try {
    const v = localStorage.getItem(LS_AUTHOR);
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
}

export function saveAuthorName(name: string) {
  if (typeof localStorage === "undefined") return;
  try {
    const v = name.trim();
    if (!v) return;
    localStorage.setItem(LS_AUTHOR, v);
  } catch {
    // ignore
  }
}

