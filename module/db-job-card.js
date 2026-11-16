// FR-JOB-01, FR-JOB-02, FR-JOB-04, FR-JOB-05, FR-JOB-06, FR-JOB-07, INT-07: Job card. Settings never leave the phone.
import { matchGloss } from "./deaf/gloss-match.js";
import { loadStrings, t } from "./core/i18n.js";

function ethiopic(iso) {
  const date = new Date(iso + "T00:00:00");
  try {
    return new Intl.DateTimeFormat("am-ET-u-ca-ethiopic", { dateStyle: "long" }).format(date);
  } catch (error) {
    return iso;
  }
}
function gregorian(iso) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(iso + "T00:00:00"));
}
function jsonld(job) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title.en,
    description: job.description.en,
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.type,
    jobLocationType: job.accessibility.some((item) => /remote/i.test(item)) ? "TELECOMMUTE" : undefined,
    hiringOrganization: { "@type": "Organization", name: job.org },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.city, addressCountry: "ET" } },
    baseSalary: { "@type": "MonetaryAmount", currency: "ETB", value: { "@type": "QuantitativeValue", minValue: job.salary.min, maxValue: job.salary.max, unitText: "MONTH" } },
    jobBenefits: job.accessibility.join(", ")
  };
}

class DbJobCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  async connectedCallback() {
    const response = await fetch(this.getAttribute("src") || "data/jobs.json");
    const jobs = await response.json();
    let terms = [];
    const glossary = this.getAttribute("glossary");
    if (glossary) {
      try { terms = (await (await fetch(glossary)).json()).terms || []; } catch (error) { terms = []; }
    }
    const lang = this.getAttribute("lang") === "en" ? "en" : "am";
    await loadStrings(lang);
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--bs-body-color,#1C1B18);font:1rem/1.5 var(--bs-body-font-family,system-ui,sans-serif)}
      article{margin:0 0 1rem;padding:1rem;border:1px solid #8A8478;border-radius:12px}
      button,input,textarea,select{font:inherit;min-height:2.75rem;margin:.25rem .25rem 0 0}
      button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #1C1B18;outline-offset:2px}
      .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
      .am{font-family:"Noto Sans Ethiopic",sans-serif;line-height:1.7}
      video{width:min(100%,16rem);background:#14130F}
      .err{color:#9B2330}
    </style>`;
    for (const job of jobs) {
      const card = document.createElement("article");
      card.lang = lang;
      const title = document.createElement("h2");
      title.textContent = job.title[lang];
      if (lang === "am") title.className = "am";
      const list = document.createElement("dl");
      const rows = [
        [t("job_company"), job.org],
        [t("job_place"), job.city],
        [t("job_pay"), "ETB " + job.salary.min + "–" + job.salary.max + " " + t("job_per_month")],
        [t("job_posted"), gregorian(job.datePosted) + " · " + ethiopic(job.datePosted)],
        [t("job_apply_by"), gregorian(job.validThrough) + " · " + ethiopic(job.validThrough)]
      ];
      for (const [name, value] of rows) {
        const dt = document.createElement("dt");
        dt.textContent = name;
        const dd = document.createElement("dd");
        dd.textContent = value;
        list.append(dt, dd);
      }
      const access = document.createElement("ul");
      for (const item of job.accessibility) {
        const li = document.createElement("li");
        li.textContent = item;
        access.append(li);
      }
      const summary = document.createElement("p");
      summary.hidden = true;
      summary.textContent = job.description[lang];
      const listen = document.createElement("button");
      listen.type = "button";
      listen.textContent = t("job_listen");
      listen.addEventListener("click", () => {
        summary.hidden = false;
        const live = this.shadowRoot.querySelector("[role=status]") || document.createElement("div");
        live.setAttribute("role", "status");
        live.className = "sr";
        live.textContent = job.description[lang];
        card.append(live);
        const api = this.getAttribute("api");
        const say = () => {
          if (!window.speechSynthesis) return;
          const said = new SpeechSynthesisUtterance(job.description[lang]);
          said.lang = lang === "am" ? "am-ET" : "en";
          speechSynthesis.cancel();
          speechSynthesis.speak(said);
        };
        if (!api) { say(); return; }
        const audio = new Audio(api + "/jobs/" + job.id + "/summary.opus?lang=" + lang);
        audio.play().catch(say);
      });
      const sign = document.createElement("button");
      sign.type = "button";
      sign.textContent = t("job_sign");
      const video = document.createElement("video");
      video.controls = true;
      video.setAttribute("aria-label", t("job_sign_label"));
      sign.addEventListener("click", () => {
        const hits = matchGloss(job.description.am + " " + job.description.en, terms).filter((hit) => hit.clip);
        if (!hits.length) { sign.insertAdjacentText("afterend", " " + t("job_no_sign")); return; }
        let at = 0;
        const play = () => {
          video.src = new URL(hits[at].clip, new URL(glossary, location.href)).href;
          video.play().catch(() => {});
        };
        video.onended = () => { at += 1; if (at < hits.length) play(); };
        card.append(video);
        play();
      });
      const apply = document.createElement("button");
      apply.type = "button";
      apply.textContent = t("job_apply");
      const form = document.createElement("form");
      form.hidden = true;
      const fields = [
        ["job_name", "input", "name"],
        ["job_contact", "input", "contact"],
        ["job_message", "textarea", "message"]
      ];
      for (const [key, tag, name] of fields) {
        const label = document.createElement("label");
        label.textContent = t(key) + " ";
        const field = document.createElement(tag);
        field.name = name;
        field.required = true;
        label.append(field);
        form.append(label);
      }
      const how = document.createElement("label");
      how.textContent = t("job_how") + " ";
      const select = document.createElement("select");
      select.name = "how";
      for (const key of ["job_text", "job_call", "job_video"]) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = t(key);
        select.append(option);
      }
      how.append(select);
      const send = document.createElement("button");
      send.type = "submit";
      send.textContent = t("job_send");
      const err = document.createElement("p");
      err.className = "err";
      err.setAttribute("role", "alert");
      form.append(how, send, err);
      apply.addEventListener("click", () => { form.hidden = false; form.querySelector("input").focus(); });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        data.job_id = job.id;
        const err = form.querySelector(".err");
        const api = this.getAttribute("api");
        if (!api) { err.textContent = t("job_no_server"); return; }
        try {
          const result = await fetch(api.replace(/\/$/, "") + "/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          const body = await result.json();
          if (!result.ok) { err.textContent = lang === "am" ? t("job_not_sent") : (body.error || t("job_not_sent")); return; }
          err.textContent = "";
          const done = document.createElement("p");
          done.setAttribute("role", "status");
          done.textContent = t("job_sent");
          form.append(done);
        } catch (error) {
          err.textContent = t("job_not_sent");
        }
      });
      card.append(title, list, access, listen, sign, summary, apply, form);
      this.shadowRoot.append(card);
      const ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify(jsonld(job));
      this.append(ld);
    }
  }
}
if (!customElements.get("db-job-card")) customElements.define("db-job-card", DbJobCard);
