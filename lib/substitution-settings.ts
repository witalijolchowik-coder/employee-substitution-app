export const AGENCIES_STORAGE_KEY = "agency_list_cache";
export const EMAIL_TEMPLATE_STORAGE_KEY = "email_template";

export interface Agency {
  id: string;
  name: string;
  coordinatorName: string;
  coordinatorEmail: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export const FALLBACK_AGENCIES: Agency[] = [
  { id: "agency_opus", name: "OPUS", coordinatorName: "", coordinatorEmail: "olena.opusapt@gmail.com" },
  { id: "agency_fast_service", name: "Fast Service", coordinatorName: "", coordinatorEmail: "v.shepel@fast-service.com.pl" },
  { id: "agency_topping_work", name: "Topping Work", coordinatorName: "", coordinatorEmail: "veranika.dubrouskaya@topping-work.pl" },
  { id: "agency_work_unit", name: "Work Unit", coordinatorName: "", coordinatorEmail: "koordynator-idl@workunit.pl" },
  { id: "agency_madmax", name: "MadMax", coordinatorName: "", coordinatorEmail: "k.volkova@madmaxwork.pl" },
  { id: "agency_ms_group", name: "MS Group", coordinatorName: "", coordinatorEmail: "v.mutovchy@msgroup.hr" },
];

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplate = {
  subject: "Informuje o zastepstwie / {date} / {shift} / Personnel Service",
  body: `Dzien dobry,

W dniu {date} prosze o udzielenie dnia wolnego dla {absentEmployee}, dzial {absentDepartment} - powod: {absentReason}.
Na zastepstwo przyjdzie do pracy {substituteEmployee} {substituteAgency} dzial {substituteDepartment}

Pozdrawiam,`,
};

export function normalizeAgencies(value: unknown): Agency[] {
  if (!Array.isArray(value)) {
    return FALLBACK_AGENCIES;
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const raw = item as Partial<Agency> & { email?: string; coordinator?: string };
      const name = String(raw.name || "").trim();
      const coordinatorEmail = String(raw.coordinatorEmail || raw.email || "").trim();

      if (!name) {
        return null;
      }

      return {
        id: String(raw.id || `agency_${index}_${name.toLowerCase().replace(/\s+/g, "_")}`),
        name,
        coordinatorName: String(raw.coordinatorName || raw.coordinator || "").trim(),
        coordinatorEmail,
      };
    })
    .filter((agency): agency is Agency => Boolean(agency));
}

export function normalizeEmailTemplate(value: unknown): EmailTemplate {
  if (!value || typeof value !== "object") {
    return DEFAULT_EMAIL_TEMPLATE;
  }

  const raw = value as Partial<EmailTemplate>;

  return {
    subject: typeof raw.subject === "string" && raw.subject.trim() ? raw.subject : DEFAULT_EMAIL_TEMPLATE.subject,
    body: typeof raw.body === "string" && raw.body.trim() ? raw.body : DEFAULT_EMAIL_TEMPLATE.body,
  };
}

export function renderEmailTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] ?? match);
}
