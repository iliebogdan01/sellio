"use client";

import Link from "next/link";

const services = [
  {
    number: "01",
    title: "Website Design",
    description:
      "Modern, professional websites designed to make your business stand out and turn visitors into customers.",
    features: ["Custom design", "Mobile responsive", "Modern user experience"],
    price: "From £299",
  },
  {
    number: "02",
    title: "E-commerce Websites",
    description:
      "Sell your products online with a clean, easy-to-use shop built around your business and customers.",
    features: ["Product pages", "Shopping experience", "Mobile optimisation"],
    price: "From £599",
  },
  {
    number: "03",
    title: "Website Redesign",
    description:
      "Give your existing website a fresh look with a clearer layout, better presentation and a modern feel.",
    features: ["Visual redesign", "Improved layout", "Responsive design"],
    price: "From £199",
  },
  {
    number: "04",
    title: "Landing Pages",
    description:
      "Focused landing pages for promotions, advertising campaigns, new products and lead generation.",
    features: ["Clear call to action", "Conversion-focused layout", "Fast loading"],
    price: "From £149",
  },
  {
    number: "05",
    title: "Business Websites",
    description:
      "Build trust with a professional online presence that explains your services and helps customers contact you.",
    features: ["Business information", "Contact form", "Professional layout"],
    price: "From £249",
  },
  {
    number: "06",
    title: "Website Maintenance",
    description:
      "Keep your website updated and organised with ongoing support when you need changes or improvements.",
    features: ["Content updates", "Small improvements", "Technical support"],
    price: "Custom quote",
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#090a0b] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090a0b]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-2xl font-black tracking-tight">
            sellio<span className="text-[#c6ff00]">.</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm sm:gap-8">
            <Link href="/" className="text-white/70 hover:text-[#c6ff00]">
              Home
            </Link>
            <Link href="/services" className="font-semibold text-[#c6ff00]">
              Services
            </Link>
            <Link href="/portfolio" className="text-white/70 hover:text-[#c6ff00]">
              Portfolio
            </Link>
            <Link
              href="/#contact"
              className="rounded-full bg-[#c6ff00] px-4 py-2.5 font-bold text-black hover:bg-white"
            >
              Let&apos;s Talk
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#c6ff00]">
          What we do
        </p>

        <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          Digital services.
          <br />
          <span className="text-[#c6ff00]">Real impact.</span>
        </h1>

        <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <p className="max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
            We help businesses build a stronger online presence through modern
            websites, thoughtful design and digital experiences made for their
            customers.
          </p>

          <Link
            href="/#contact"
            className="inline-flex w-fit items-center gap-3 rounded-full border border-[#c6ff00]/50 px-6 py-3 font-semibold hover:bg-[#c6ff00] hover:text-black"
          >
            Start a project <span>↗</span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.number}
              className="group flex flex-col rounded-3xl border border-white/10 bg-[#111315] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c6ff00]/50 sm:p-8"
            >
              <div className="mb-10 flex items-center justify-between">
                <span className="text-sm font-bold text-[#c6ff00]">
                  {service.number}
                </span>
                <span className="text-2xl text-white/30 transition group-hover:text-[#c6ff00]">
                  ↗
                </span>
              </div>

              <h2 className="mb-4 text-2xl font-bold">{service.title}</h2>

              <p className="mb-7 leading-7 text-white/60">
                {service.description}
              </p>

              <ul className="mb-8 space-y-3">
                {service.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-white/75"
                  >
                    <span className="text-[#c6ff00]">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto border-t border-white/10 pt-6">
                <p className="mb-5 text-sm text-white/40">Pricing</p>
                <p className="mb-6 text-xl font-black">{service.price}</p>
                <Link
                  href={`/?service=${encodeURIComponent(service.title)}#contact`}
                  className="flex w-full items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-bold transition hover:border-[#c6ff00] hover:bg-[#c6ff00] hover:text-black"
                >
                  Request a quote <span className="ml-2">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111315]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#c6ff00]">
              Have a project in mind?
            </p>
            <h2 className="max-w-2xl text-3xl font-black sm:text-4xl">
              Let&apos;s build something that moves your business forward.
            </h2>
          </div>
          <Link
            href="/#contact"
            className="inline-flex w-fit shrink-0 items-center gap-3 rounded-full bg-[#c6ff00] px-7 py-4 font-bold text-black hover:bg-white"
          >
            Get in touch <span>↗</span>
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-white/40 sm:px-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-xl font-black text-white">
          sellio<span className="text-[#c6ff00]">.</span>
        </Link>
        <p>Web design for businesses ready to grow.</p>
        <p>© {new Date().getFullYear()} Sellio. All rights reserved.</p>
      </footer>
    </main>
  );
}