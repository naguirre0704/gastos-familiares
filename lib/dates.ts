/** DD/MM/YYYY → YYYY-MM-DD (para inputs type="date") */
export function toInputDate(dmy: string): string {
  const [dd, mm, yyyy] = dmy.split("/");
  return dd && mm && yyyy ? `${yyyy}-${mm}-${dd}` : "";
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function fromInputDate(ymd: string): string {
  const [yyyy, mm, dd] = ymd.split("-");
  return yyyy && mm && dd ? `${dd}/${mm}/${yyyy}` : "";
}
