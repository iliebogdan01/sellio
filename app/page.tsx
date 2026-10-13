"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const services = [
  {
    number: "01",
    icon: "✦",
    title: "Business Websites",
    description: "Professional websites that build trust and help your business attract customers.",
    price: "£199",
  },
  {
    number: "02",
    icon: "◈",
    title: "E-commerce Stores",
    description: "Online shops designed to showcase products and sell online.",
    price: "£799",
  },
  {
    number: "03",
    icon: "↗",
    title: "Landing Pages",
    description: "High-impact landing pages for products, services and special offers.",
    price: "£149",
  },
  {
    number: "04",
    icon: "⚙",
    title: "Website Maintenance",
    description: "Website updates and maintenance to keep your online presence running smoothly.",
    price: "£29/mo",
  },
];

const packages = [
  {
    name: "Starter",
    price: "£199",
    description: "A professional online presence for small businesses.",
    features: [
      "Custom website design",
      "Up to 3 pages",
      "Mobile responsive layout",
      "Contact form",
      "Basic SEO setup",
    ],
  },
  {
    name: "Professional",
    price: "£399",
    description: "More space to showcase your business and services.",
    features: [
      "Custom website design",
      "Up to 6 pages",
      "Mobile responsive layout",
      "Contact form",
      "SEO-friendly structure",
      "Social media integration",
    ],
    popular: true,
  },
  {
    name: "Online Store",
    price: "£799",
    description: "Start presenting and selling products online.",
    features: [
      "Custom online store",
      "Product catalogue setup",
      "Responsive design",
      "Shopping cart setup",
      "Checkout integration",
      "Basic SEO setup",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Tell us your idea",
    description: "Share your business details, goals and the website you have in mind.",
  },
  {
    number: "02",
    title: "We design your website",
    description: "We create a design based on your brand, audience and requirements.",
  },
  {
    number: "03",
    title: "Review the design",
    description: "Review the proposed website and discuss any agreed changes.",
  },
  {
    number: "04",
    title: "Launch your website",
    description: "Once approved, we arrange the final steps needed to launch your website.",
  },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#101211] px-4 py-3.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#c6ff00] focus:ring-2 focus:ring-[#c6ff00]/10";

const sectionClass =
  "w-full px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28 xl:px-16 2xl:px-24";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [service, setService] = useState("Business Website");
  const [budget, setBudget] = useState("£199–£399");
  const [details, setDetails] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setFormMessage("");
    setFormSuccess(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("website_enquiries").insert({
        customer_name: name.trim(),
        email: email.trim(),
        business_name: business.trim() || null,
        service,
        budget,
        project_details: details.trim(),
      });

      if (error) {
        console.error("Supabase enquiry error:", error.message);
        setFormMessage("We could not submit your enquiry. Please try again.");
        return;
      }

      setFormSuccess(true);
      setFormMessage("Thank you! Your enquiry has been submitted successfully.");

      setName("");
      setEmail("");
      setBusiness("");
      setService("Business Website");
      setBudget("£199–£399");
      setDetails("");
    } catch (error) {
      console.error("Enquiry submission failed:", error);
      setFormMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function chooseService(value: string) {
    setService(value);
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#090a0b] text-[#f5f7f5]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090a0b]/90 backdrop-blur-xl">
        <div className="flex min-h-[76px] items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-16">
          <a href="#home" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c6ff00] text-xl font-black text-black transition group-hover:rotate-[-6deg]">
              S
            </span>
            <span className="text-2xl font-black tracking-tight">
              Sellio<span className="text-[#c6ff00]">.</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {[
              ["Services", "#services"],
              ["Pricing", "#pricing"],
              ["How it works", "#process"],
              ["About", "#about"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium text-gray-400 transition hover:text-[#c6ff00]"
              >
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="hidden rounded-full bg-[#c6ff00] px-6 py-3 text-sm font-black text-black transition hover:bg-white sm:inline-flex"
          >
            Get a quote ↗
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-xl lg:hidden"
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-white/10 bg-[#0d0f0e] p-4 lg:hidden">
            {[
              ["Services", "#services"],
              ["Pricing", "#pricing"],
              ["How it works", "#process"],
              ["About", "#about"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 font-medium text-gray-300 hover:bg-white/5 hover:text-[#c6ff00]"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#c6ff00]/[0.08] blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-[#c6ff00]/[0.04] blur-[100px]" />

        <div className="relative grid items-center gap-16 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-12 lg:py-32 xl:px-16 2xl:px-24">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#c6ff00]/20 bg-[#c6ff00]/[0.06] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#c6ff00] sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#c6ff00]" />
              Digital experiences that deliver
            </div>

            <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl xl:text-[86px]">
              Make your
              <br />
              business
              <br />
              <span className="text-[#c6ff00]">stand out.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-gray-400 sm:text-xl">
              We build modern websites that make your business look its best,
              attract new customers and turn visitors into enquiries.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#c6ff00] px-8 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-white"
              >
                Start your project <span className="ml-2">↗</span>
              </a>
              <a
                href="#services"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 px-8 py-4 font-bold text-white transition hover:border-[#c6ff00]/50 hover:text-[#c6ff00]"
              >
                Explore services
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 border-t border-white/10 pt-7 text-sm text-gray-400">
              <span><span className="mr-2 text-[#c6ff00]">✓</span>Modern design</span>
              <span><span className="mr-2 text-[#c6ff00]">✓</span>Mobile-ready</span>
              <span><span className="mr-2 text-[#c6ff00]">✓</span>Clear pricing</span>
            </div>
          </div>

          {/* Website preview */}
          <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="absolute -inset-5 rounded-[35px] bg-[#c6ff00]/[0.07] blur-3xl" />

            <div className="relative overflow-hidden rounded-[25px] border border-white/10 bg-[#111412] p-3 shadow-2xl sm:p-5">
              <div className="flex items-center gap-2 border-b border-white/10 px-2 pb-4">
                <span className="h-3 w-3 rounded-full bg-[#ff605c]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd44]" />
                <span className="h-3 w-3 rounded-full bg-[#00ca4e]" />
                <div className="ml-3 flex-1 rounded-full bg-[#090a0b] px-4 py-2 text-center text-xs text-gray-500">
                  yourbusiness.co.uk
                </div>
              </div>

              <div className="grid min-h-[340px] grid-cols-2 overflow-hidden rounded-2xl bg-[#171b17] sm:min-h-[430px]">
                <div className="flex flex-col justify-center p-5 sm:p-8">
                  <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c6ff00] sm:text-xs">
                    Your business. Your vision.
                  </div>
                  <div className="text-2xl font-black leading-tight sm:text-4xl">
                    Built to
                    <br />
                    <span className="text-[#c6ff00]">move you</span>
                    <br />
                    forward.
                  </div>
                  <p className="mt-4 text-xs leading-6 text-gray-400 sm:text-sm">
                    A powerful online presence starts here.
                  </p>
                  <span className="mt-6 inline-flex w-fit rounded-full bg-[#c6ff00] px-4 py-2 text-[10px] font-black text-black sm:text-xs">
                    Discover more ↗
                  </span>
                </div>

                <div className="relative flex items-center justify-center overflow-hidden bg-[#c6ff00] p-4 sm:p-7">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-black/15" />
                  <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full border border-black/15" />

                  <div className="relative w-full -rotate-3 rounded-2xl border border-black/10 bg-[#111412] p-3 shadow-2xl sm:p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-xs font-black text-white">BRAND STUDIO</span>
                      <span className="text-lg text-[#c6ff00]">✳</span>
                    </div>
                    <div className="mb-2 h-3 w-4/5 rounded-full bg-white/90" />
                    <div className="mb-2 h-3 w-3/5 rounded-full bg-white/25" />
                    <div className="mb-5 h-2 w-full rounded-full bg-white/10" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-20 rounded-xl bg-[#c6ff00] sm:h-28" />
                      <div className="h-20 rounded-xl bg-white/10 sm:h-28" />
                      <div className="col-span-2 flex h-12 items-center justify-between rounded-xl bg-white/5 px-3">
                        <span className="text-[10px] text-gray-300">Your next big idea</span>
                        <span className="text-[#c6ff00]">↗</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-4 sm:px-3">
                <div>
                  <div className="text-sm font-bold">Designed to make an impact</div>
                  <div className="mt-1 text-xs text-gray-500">Modern. Responsive. Professional.</div>
                </div>
                <span className="rounded-full border border-[#c6ff00]/20 bg-[#c6ff00]/[0.07] px-3 py-2 text-xs font-bold text-[#c6ff00]">
                  Let&apos;s build ↗
                </span>
              </div>
            </div>

            <div className="absolute -left-2 top-10 hidden rounded-2xl border border-white/10 bg-[#111412] p-4 shadow-xl sm:block lg:-left-8">
              <div className="text-xs text-gray-500">Projects from</div>
              <div className="mt-1 text-2xl font-black">£149</div>
              <div className="text-xs font-semibold text-[#c6ff00]">Built around you</div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b border-white/[0.06] bg-[#0d0f0e]">
        <div className="grid grid-cols-2 gap-8 px-5 py-9 sm:px-8 md:grid-cols-4 lg:px-12 xl:px-16">
          {[
            ["01", "Personalised design"],
            ["02", "Mobile-friendly"],
            ["03", "Transparent pricing"],
            ["04", "Direct communication"],
          ].map(([number, label]) => (
            <div key={number} className="flex items-center gap-3">
              <span className="text-sm font-black text-[#c6ff00]">{number}</span>
              <span className="text-sm font-semibold text-gray-300 sm:text-base">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className={`${sectionClass} scroll-mt-24 bg-[#090a0b]`}>
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#c6ff00]">
              What we do <span className="ml-2 text-gray-600">/ 01</span>
            </p>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Digital services.
              <br />
              <span className="text-gray-500">Real possibilities.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-gray-400 sm:text-lg">
            From a simple business website to a complete online store, we
            create digital experiences tailored to your goals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((item) => (
            <article
              key={item.number}
              className="group flex min-h-[310px] flex-col rounded-3xl border border-white/10 bg-[#101211] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c6ff00]/40 hover:bg-[#141713] sm:p-7"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c6ff00]/15 bg-[#c6ff00]/[0.07] text-2xl text-[#c6ff00] transition group-hover:bg-[#c6ff00] group-hover:text-black">
                  {item.icon}
                </span>
                <span className="text-sm font-bold text-gray-600">{item.number}</span>
              </div>
              <h3 className="mt-7 text-xl font-bold sm:text-2xl">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-gray-400">{item.description}</p>
              <div className="mt-7 flex items-end justify-between border-t border-white/10 pt-5">
                <div>
                  <div className="text-xs text-gray-500">Starting from</div>
                  <div className="mt-1 text-2xl font-black">{item.price}</div>
                </div>
                <a
                  href="#contact"
                  onClick={() => chooseService(item.title)}
                  aria-label={`Enquire about ${item.title}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-xl transition hover:bg-[#c6ff00] hover:text-black"
                >
                  ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-24 border-y border-white/[0.06] bg-[#101211]">
        <div className={`${sectionClass} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20`}>
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#c6ff00]">
              Why Sellio <span className="ml-2 text-gray-600">/ 02</span>
            </p>
            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Good design
              <br />
              should work
              <br />
              <span className="text-[#c6ff00]">for your business.</span>
            </h2>
          </div>

          <div>
            <p className="text-lg leading-8 text-gray-400">
              Your website is often the first impression people have of your
              business. We focus on clear messaging, thoughtful design and
              responsive layouts that help visitors understand what you offer.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Thoughtful design", "A look that fits your business and brand."],
                ["Built for mobile", "Layouts that adapt to different screens."],
                ["Clear communication", "Know what is included in your project."],
                ["Room to grow", "Plan a website around your future goals."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-[#c6ff00]/30">
                  <div className="mb-2 font-bold">{title}</div>
                  <p className="text-sm leading-6 text-gray-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-24 bg-[#090a0b]">
        <div className={sectionClass}>
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#c6ff00]">
              Simple pricing <span className="ml-2 text-gray-600">/ 03</span>
            </p>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Choose your package.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
              Start with a clear idea of your budget. We can discuss the final
              scope, features and price before work begins.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            {packages.map((item) => (
              <article
                key={item.name}
                className={`relative flex flex-col rounded-3xl border p-7 transition sm:p-9 ${
                  item.popular
                    ? "border-[#c6ff00]/60 bg-[#141811] shadow-[0_0_50px_rgba(198,255,0,0.06)] lg:scale-[1.03]"
                    : "border-white/10 bg-[#101211] hover:border-white/20"
                }`}
              >
                {item.popular && (
                  <div className="absolute right-5 top-5 rounded-full bg-[#c6ff00] px-3 py-1.5 text-xs font-black text-black">
                    Most popular
                  </div>
                )}
                <h3 className="text-2xl font-black">{item.name}</h3>
                <p className="mt-3 min-h-14 text-sm leading-6 text-gray-400">{item.description}</p>
                <div className="mt-7 flex flex-wrap items-end gap-2">
                  <span className="text-5xl font-black tracking-tight">{item.price}</span>
                  <span className="mb-2 text-sm text-gray-500">starting price</span>
                </div>
                <div className="my-7 border-t border-white/10" />
                <div className="mb-4 text-sm font-bold">What&apos;s included</div>
                <ul className="flex-1 space-y-4">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <span className="font-black text-[#c6ff00]">✓</span>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  onClick={() => chooseService(item.name)}
                  className={`mt-9 flex min-h-14 items-center justify-center rounded-full px-5 py-4 text-center text-sm font-black transition ${
                    item.popular
                      ? "bg-[#c6ff00] text-black hover:bg-white"
                      : "border border-white/15 bg-white/5 text-white hover:border-[#c6ff00]/50 hover:text-[#c6ff00]"
                  }`}
                >
                  Choose {item.name} ↗
                </a>
              </article>
            ))}
          </div>

          <p className="mt-8 text-center text-xs leading-6 text-gray-500">
            Prices are starting estimates. Final pricing depends on the agreed
            scope and requirements. Domain, hosting and third-party fees may be additional.
          </p>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="scroll-mt-24 border-y border-white/[0.06] bg-[#101211]">
        <div className={sectionClass}>
          <div className="mb-14 max-w-3xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#c6ff00]">
              How it works <span className="ml-2 text-gray-600">/ 04</span>
            </p>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              From first idea
              <br />
              <span className="text-gray-500">to launch.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <article key={step.number} className="border-t-2 border-[#c6ff00]/30 pt-6 transition hover:border-[#c6ff00]">
                <div className="text-sm font-black text-[#c6ff00]">{step.number}</div>
                <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-400 sm:text-base">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM — SAVES TO SUPABASE */}
      <section id="contact" className="scroll-mt-24 bg-[#090a0b]">
        <div className={`${sectionClass} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#c6ff00]">
              Let&apos;s work together <span className="ml-2 text-gray-600">/ 05</span>
            </p>
            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Let&apos;s build
              <br />
              something
              <br />
              <span className="text-[#c6ff00]">great.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-gray-400 sm:text-lg">
              Tell us about your business and what you want to create. Submit
              the form and your enquiry will be saved for follow-up.
            </p>

            <div className="mt-9 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#101211] text-xl text-[#c6ff00]">
                ✉
              </div>
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <a href="mailto:hello@sellio.co.uk" className="mt-1 inline-block font-bold hover:text-[#c6ff00]">
                  hello@sellio.co.uk
                </a>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full rounded-3xl border border-white/10 bg-[#101211] p-5 shadow-2xl sm:p-8 lg:p-10"
          >
            <h3 className="text-2xl font-black sm:text-3xl">Request a quote<span className="text-[#c6ff00]">.</span></h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Complete the details below to submit your project enquiry.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-200">Your name *</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Smith"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-200">Email address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="john@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="business" className="mb-2 block text-sm font-semibold text-gray-200">Business name</label>
                <input
                  id="business"
                  name="business"
                  maxLength={200}
                  value={business}
                  onChange={(event) => setBusiness(event.target.value)}
                  placeholder="Your company"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="service" className="mb-2 block text-sm font-semibold text-gray-200">What do you need? *</label>
                <select
                  id="service"
                  name="service"
                  required
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                  className={inputClass}
                >
                  <option>Business Website</option>
                  <option>Business Websites</option>
                  <option>Landing Page</option>
                  <option>Landing Pages</option>
                  <option>E-commerce Store</option>
                  <option>E-commerce Stores</option>
                  <option>Website Maintenance</option>
                  <option>Starter</option>
                  <option>Professional</option>
                  <option>Online Store</option>
                  <option>Not sure yet</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="budget" className="mb-2 block text-sm font-semibold text-gray-200">Your estimated budget</label>
                <select
                  id="budget"
                  name="budget"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className={inputClass}
                >
                  <option>Under £199</option>
                  <option>£199–£399</option>
                  <option>£400–£799</option>
                  <option>£800–£1,500</option>
                  <option>£1,500+</option>
                  <option>Not sure yet</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="details" className="mb-2 block text-sm font-semibold text-gray-200">Tell us about your project *</label>
                <textarea
                  id="details"
                  name="details"
                  required
                  minLength={5}
                  maxLength={5000}
                  rows={5}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="What does your business do? What should your website achieve?"
                  className={`${inputClass} resize-y leading-6`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex min-h-14 w-full items-center justify-center rounded-full bg-[#c6ff00] px-6 py-4 font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Send my enquiry"}
              {!submitting && <span className="ml-2">↗</span>}
            </button>

            {formMessage && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-4 text-center text-sm font-medium ${
                  formSuccess ? "text-[#c6ff00]" : "text-red-400"
                }`}
              >
                {formMessage}
              </p>
            )}

            <p className="mt-4 text-center text-xs leading-5 text-gray-500">
              Your enquiry will be submitted to Sellio for follow-up.
            </p>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#070808] text-white">
        <div className="grid gap-10 px-5 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr] lg:px-12 xl:px-16 2xl:px-24">
          <div>
            <a href="#home" className="inline-flex items-center gap-3 text-2xl font-black">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c6ff00] text-black">S</span>
              Sellio<span className="text-[#c6ff00]">.</span>
            </a>
            <p className="mt-5 max-w-md text-sm leading-7 text-gray-500">
              Professional website design and development for businesses
              ready to build their online presence.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Explore</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-gray-500">
              <a className="transition hover:text-[#c6ff00]" href="#services">Services</a>
              <a className="transition hover:text-[#c6ff00]" href="#pricing">Pricing</a>
              <a className="transition hover:text-[#c6ff00]" href="#process">How it works</a>
              <a className="transition hover:text-[#c6ff00]" href="#about">About Sellio</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Get in touch</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-gray-500">
              <a className="transition hover:text-[#c6ff00]" href="#contact">Request a quote</a>
              <a className="transition hover:text-[#c6ff00]" href="mailto:hello@sellio.co.uk">hello@sellio.co.uk</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 px-5 py-6 text-xs text-gray-600 sm:flex-row sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
          <span>© {new Date().getFullYear()} Sellio. All rights reserved.</span>
          <a className="transition hover:text-[#c6ff00]" href="#home">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}