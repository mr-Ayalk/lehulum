// FR-DEAF-11, FR-SL-07: Longest glossary match. Machine output, not a human translation.
export function matchGloss(text, terms) {
  const source = String(text || "");
  const forms = [];
  for (const term of terms || []) {
    const names = [term.am, ...(term.forms_am || []), term.en, ...(term.forms_en || [])];
    for (const form of names) if (form) forms.push({ form: String(form), term });
  }
  forms.sort((a, b) => b.form.length - a.form.length);
  const taken = new Array(source.length).fill(false);
  const hits = [];
  for (const item of forms) {
    const needle = item.form.toLowerCase();
    const hay = source.toLowerCase();
    let from = 0;
    while (from < hay.length) {
      const at = hay.indexOf(needle, from);
      if (at < 0) break;
      const end = at + needle.length;
      const latin = /^[\u0000-\u007f]+$/.test(item.form);
      const before = at === 0 || !/\p{L}/u.test(source[at - 1]);
      const after = end >= source.length || !/\p{L}/u.test(source[end]);
      const free = !taken.slice(at, end).some(Boolean);
      if (free && (!latin || (before && after))) {
        for (let i = at; i < end; i += 1) taken[i] = true;
        hits.push({ at, term: item.term });
        from = end;
      } else from = at + 1;
    }
  }
  hits.sort((a, b) => a.at - b.at);
  return hits.map((hit) => ({
    id: hit.term.id,
    am: hit.term.am || "",
    en: hit.term.en || "",
    clip: hit.term.sign || "",
    labelled: "machine"
  }));
}
