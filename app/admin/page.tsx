import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EnquiryStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "completed"
  | "cancelled";

type Enquiry = {
  id: string;
  customer_name: string;
  email: string;
  business_name: string | null;
  service: string;
  budget: string | null;
  project_details: string;
  status: EnquiryStatus;
  created_at: string;
};

const statusLabels: Record<EnquiryStatus, string> = {
  new: "Nouă",
  contacted: "Contactat",
  in_progress: "În lucru",
  completed: "Finalizată",
  cancelled: "Anulată",
};

const statusStyles: Record<EnquiryStatus, string> = {
  new: "border-lime-400/30 bg-lime-400/10 text-lime-300",
  contacted: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  in_progress: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-red-400/30 bg-red-400/10 text-red-300",
};

async function getAuthorizedAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (
    error ||
    !user ||
    !user.email ||
    !adminEmail ||
    user.email.toLowerCase() !== adminEmail
  ) {
    redirect("/login");
  }

  return user;
}

async function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Lipsesc NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY din .env.local."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function updateEnquiryStatus(formData: FormData) {
  "use server";

  await getAuthorizedAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  const allowedStatuses: EnquiryStatus[] = [
    "new",
    "contacted",
    "in_progress",
    "completed",
    "cancelled",
  ];

  if (!id || !allowedStatuses.includes(status as EnquiryStatus)) {
    redirect("/admin?error=invalid");
  }

  const adminClient = await getAdminSupabase();

  const { error } = await adminClient
    .from("website_enquiries")
    .update({ status: status as EnquiryStatus })
    .eq("id", id);

  if (error) {
    console.error("Admin status update failed:", error.message);
    redirect("/admin?error=update");
  }

  redirect("/admin?updated=1");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await getAuthorizedAdmin();

  let enquiries: Enquiry[] = [];
  let loadError = false;

  try {
    const adminClient = await getAdminSupabase();

    const { data, error } = await adminClient
      .from("website_enquiries")
      .select(
        "id, customer_name, email, business_name, service, budget, project_details, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin enquiries load failed:", error.message);
      loadError = true;
    } else {
      enquiries = (data ?? []) as Enquiry[];
    }
  } catch (error) {
    console.error(
      "Admin configuration error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    loadError = true;
  }

  const newCount = enquiries.filter((item) => item.status === "new").length;
  const activeCount = enquiries.filter(
    (item) => item.status === "in_progress"
  ).length;
  const completedCount = enquiries.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <main className="min-h-screen bg-[#090a0b] text-white">
      <header className="border-b border-white/10 bg-[#090a0b]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-8">
          <a href="/" className="text-3xl font-black tracking-tight">
            sellio<span className="text-[#c6ff00]">.</span>
            <span className="ml-3 text-sm font-semibold text-white/40">
              ADMIN
            </span>
          </a>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="text-right">
              <p className="text-sm font-bold">Administrator</p>
              <p className="max-w-64 break-all text-xs text-white/45">
                {user.email}
              </p>
            </div>
            <a
              href="/"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-[#c6ff00] hover:text-[#c6ff00]"
            >
              Vezi site-ul ↗
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#c6ff00]">
            Sellio Agency
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            Cereri de ofertă
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/55">
            Aici găsești solicitările trimise prin formularul site-ului,
            informațiile clienților și statusul fiecărui proiect.
          </p>
        </div>

        {params.updated === "1" && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-300">
            Statusul cererii a fost actualizat.
          </div>
        )}

        {params.error === "update" && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-300">
            Statusul nu a putut fi actualizat. Verifică baza de date și
            configurația Supabase.
          </div>
        )}

        {params.error === "invalid" && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-300">
            Datele trimise pentru actualizare nu sunt valide.
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total cereri" value={enquiries.length} />
          <StatCard title="Cereri noi" value={newCount} />
          <StatCard title="În lucru" value={activeCount} />
          <StatCard title="Finalizate" value={completedCount} />
        </section>

        {loadError ? (
          <section className="rounded-3xl border border-red-400/20 bg-[#111315] p-6 sm:p-9">
            <h2 className="text-xl font-bold text-red-300">
              Nu am putut încărca ofertele.
            </h2>
            <p className="mt-3 leading-7 text-white/60">
              Verifică dacă variabilele Supabase sunt configurate în
              .env.local și dacă tabelul website_enquiries există.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#111315]">
            <div className="border-b border-white/10 px-5 py-6 sm:px-7">
              <h2 className="text-xl font-black">Oferte primite</h2>
              <p className="mt-2 text-sm text-white/45">
                Cele mai recente solicitări sunt afișate primele.
              </p>
            </div>

            {enquiries.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c6ff00]/10 text-2xl text-[#c6ff00]">
                  ✉
                </div>
                <h3 className="text-lg font-bold">
                  Nu ai primit încă nicio ofertă.
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/50">
                  Când cineva trimite formularul de contact de pe site și
                  datele sunt salvate în Supabase, cererea va apărea aici.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {enquiries.map((item) => (
                  <article key={item.id} className="p-5 sm:p-7">
                    <div className="flex flex-col justify-between gap-6 xl:flex-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="break-words text-xl font-black">
                            {item.customer_name}
                          </h3>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              statusStyles[item.status] ??
                              "border-white/10 bg-white/5 text-white/60"
                            }`}
                          >
                            {statusLabels[item.status] ?? item.status}
                          </span>
                        </div>

                        <a
                          href={`mailto:${item.email}`}
                          className="mt-2 inline-block break-all text-sm text-[#c6ff00] hover:underline"
                        >
                          {item.email}
                        </a>

                        {item.business_name && (
                          <p className="mt-3 text-sm text-white/65">
                            <span className="font-bold text-white">
                              Firmă:
                            </span>{" "}
                            {item.business_name}
                          </p>
                        )}

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <InfoItem label="Serviciu" value={item.service} />
                          <InfoItem
                            label="Buget"
                            value={item.budget || "Nespecificat"}
                          />
                          <InfoItem
                            label="Data primirii"
                            value={formatDate(item.created_at)}
                          />
                          <InfoItem
                            label="ID cerere"
                            value={item.id}
                          />
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#c6ff00]">
                            Detaliile proiectului
                          </p>
                          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/70">
                            {item.project_details || "Nu au fost adăugate detalii."}
                          </p>
                        </div>
                      </div>

                      <aside className="w-full shrink-0 rounded-2xl border border-white/10 bg-black/20 p-4 xl:w-64">
                        <form action={updateEnquiryStatus}>
                          <input
                            type="hidden"
                            name="id"
                            value={item.id}
                          />

                          <label
                            htmlFor={`status-${item.id}`}
                            className="mb-3 block text-sm font-bold"
                          >
                            Statusul cererii
                          </label>

                          <select
                            id={`status-${item.id}`}
                            name="status"
                            defaultValue={item.status}
                            className="w-full rounded-xl border border-white/15 bg-[#111315] px-3 py-3 text-sm text-white outline-none focus:border-[#c6ff00]"
                          >
                            {Object.entries(statusLabels).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>

                          <button
                            type="submit"
                            className="mt-3 w-full rounded-xl bg-[#c6ff00] px-4 py-3 text-sm font-black text-black transition hover:bg-white"
                          >
                            Salvează statusul
                          </button>

                          <a
                            href={`mailto:${item.email}?subject=${encodeURIComponent("Sellio - oferta ta")}`}
                            className="mt-3 block w-full rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-bold hover:border-[#c6ff00] hover:text-[#c6ff00]"
                          >
                            Contactează clientul ↗
                          </a>
                        </form>
                      </aside>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="py-8 text-center text-xs text-white/35">
          Sellio Admin · Acces destinat administratorului autorizat.
        </footer>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111315] p-6">
      <p className="text-sm font-semibold text-white/45">{title}</p>
      <p className="mt-3 text-4xl font-black text-[#c6ff00]">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="break-words text-sm text-white/85">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Dată indisponibilă";
  }

  return date.toLocaleString("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}