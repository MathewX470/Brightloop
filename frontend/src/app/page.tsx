"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Service = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

type Project = {
  title: string;
  description: string;
  image: string;
  alt: string;
  href: string;
};

const imageUrls = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuAz5YjA3JqircR_xBj_ZtlJU5XNrtctbtvZ9xDVYucKPP13NYtG4t_ody9tZHkdjgyral_tWqN-U3cTKnMkuIoXlzd7jZGDzLfDEPKagnMgjYyVGQiTfB8pP0hs5wLLSzy_puRRBRY58J-76XJtQZ-6bMZijkYttGfca7KQ9tLa1DSSOHmpis231HSwFwJOIGVH17rIZH7BMvu1oEvYlaAuJ5SCdz-3H3EfKncfdsc",
  team: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoZr55EMz8yQpoPlXLJ9K3YnZo-Wdd6lmvO5Xt2DpfEcFAM5T_jV2Xe1nwIxN4GMIgFeAr-ji6KOdARqJf8iRXGiR-11lrUQ-boHGhg2cbzyqvhNptdeW0InCr00Y6sJxEW4-uAwZY0kDpsCHuYtvBG061I-H-bTNj8MJKjtw9q_0xChmO2TBWPMCwtpvjfmvmGQo18nUP7zh68z1msqYIjLHnG8K51LCSLDFV-1g",
  product: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoWBy2OeN0Fxw4RBeUbgIzRznZQK6CoaZGeh-nGGxc7DCMpHG7qOYAGgRvGNkAEeiICWSO7gtGp1VwapIWkueAJH7MkfhyCYFKtuWYP3JB23isPTM7uDOB3Hj90X-QhPr0p9QVx2Z0vi1HGutx97uF6AknhzkFkK_PxPqXUK4xYLvYLcpYlu_brhYrOGlsxUVD0rhPZqXtBj9s1nXYJSrKZeZkk3K-IIm9YMIpYxg",
  billing: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqkZHIRj0rxWmhLe_ad4TAito_JADb6TfTImX5cRgHyk-OEgIgvaHN9HRXtuhZw8Rbrs85xPs3fJSuzGI3gcULHvPofeK8MOMPFiuLaCrk4Il006_qvrU4EuHe5_vHOhOz4zY2pbpHCFtbCw4nvrNvaOYyfVb9JEpQ02FQFuZthWFEAXeo_fycgRcAkdivWCaEA7Xe5bzfPCUIkzNh7zdJL5UlIDhTvrkI2IRS-OI",
  analytics: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKOYpkVJIiTwGxyByTJMeFyPFu0E0_T1sdpAHr93OmZpxa3Glyjw138NGaUGjHpHQcWb5xt-BTrrOUIXoMzOCkZPX61fDlJplvupwClIpthFMx0SSWcg7gZHjHq9XLBncMUZ1xrdZtvQj4pznuH7GviBSv9Qe6H6gMTsXgYlKT0D00k1awbn34NODOjgdLk2qXaX2RuZ8x3TR-D_Zr86n5qQ-KZGNFPoixOEWvM",
  capabilities: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9FmV37gubxXesQVSSDRj4dspNtgn4CVXFrjj2HGhfJKHNVVn10qwGF2zUL1j9Lpk_8E-nhi8wdfU-UcebEuXDtgzVfIV2sE3diLXeSdBDSRh93M5TyhYSTCDYlnRbV28DLDD1qwBCi46DQaZboYv9cEartWFLU3ttDU7GG7R3ogGVtloGgKV0pvZXYkBT96ca4vP3v0F9WmzV5QBVCAItWI4uEJd6vFozx5YgJ3Y",
  access: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFoTWg4n84OjVGs1ooL3_2GhegJ92wH8B1pE0kM8Y_XX03iwiJuuFqTSQZfLwcA2bOKw89iRuotybfHdj-zeHayq_czcnVft7o_whGbw7INmv4Y-HeHiyuddTFEnYIQg8B0aj3T8vNZrw98HPvtxQijsZfQYkyO10V3fz6YnryWB-LYLphy4RYku7pzUqLyQrv7_w-aomEOUn9z8edW6lNH4Tm_JBY6ZVg63qHqXU",
};

const services: Service[] = [
  {
    title: "Bespoke Product & Plan Management",
    description:
      "Create and manage products with multiple brand-based variants, daily, weekly, monthly, and yearly recurring intervals. Configure automated pause, renewal, and closure lifecycles with absolute precision tailored to your sales funnel.",
    image: imageUrls.product,
    alt: "Product and plan management interface",
  },
  {
    title: "Precision Recurring Billing",
    description:
      "Auto-generate invoices on specified recurring dates with multi-jurisdiction tax rules, automated discounts, and status progressions from Draft to Paid. Includes automated PDF dispatch and instant receipt distribution.",
    image: imageUrls.billing,
    alt: "Automated billing engine",
  },
  {
    title: "Consultation, Analytics & Revenue Audit",
    description:
      "Record payments, reconcile open balances, track overdue accounts, and audit MRR/ARR in real time. Our analytics suite ensures complete financial visibility and transparent subscription forecasting.",
    image: imageUrls.analytics,
    alt: "Real-time revenue analytics",
  },
];

const projects: Project[] = [
  {
    title: "Administrator Command Center",
    description:
      "Full administrative oversight over products, recurring plans, taxes, discounts, employee access tokens, and enterprise-wide financial reporting.",
    image: imageUrls.capabilities,
    alt: "Administrator command center",
    href: "/dashboard",
  },
  {
    title: "Internal Staff Billing Portal",
    description:
      "Streamline subscription quotes, convert quotes to confirmed plans with one click, handle customer payments, and track overdue receivables seamlessly.",
    image: imageUrls.billing,
    alt: "Internal staff billing portal",
    href: "/login",
  },
  {
    title: "Self-Service Customer Portal",
    description:
      "Dedicated client dashboard allowing subscribers to track renewal schedules, review billing history, manage payment methods, and download official invoices.",
    image: imageUrls.access,
    alt: "Self-service customer portal",
    href: "/my-subscriptions",
  },
];

/**
 * Scroll Reveal Component:
 * Observes when the element scrolls into view and applies smooth fade-in and slide-up animations.
 */
function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transform: isVisible ? "none" : `translateY(${y}px)`,
        opacity: isVisible ? 1 : 0,
        transition: `opacity 750ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 750ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105 ${
          inverted ? "bg-white text-black" : "bg-black text-white"
        }`}
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.58m15.36 2A8 8 0 0 0 4.58 9M4.58 9H9m11 11v-5h-.58a8 8 0 0 1-15.36-2m15.36 2H15"
          />
        </svg>
      </div>
      <div>
        <span
          className={`block text-xl font-bold leading-tight tracking-tight ${
            inverted ? "text-white" : "text-gray-900"
          }`}
        >
          Brightloop
        </span>
        <span
          className={`block text-[11px] font-medium uppercase tracking-wider ${
            inverted ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Subscription Management
        </span>
      </div>
    </div>
  );
}

function ExternalImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      unoptimized
      className={className}
    />
  );
}

export default function Home() {
  return (
    <div className="bg-white font-sans text-gray-900 selection:bg-gray-200">
      {/* Sticky Header */}
      <header className="motion-fade sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-24 max-w-none items-center justify-between px-8">
          <Link href="#home" aria-label="Brightloop home">
            <Logo />
          </Link>
          <nav className="hidden items-center space-x-10 text-base font-medium text-gray-700 md:flex">
            <a className="transition-colors hover:text-black" href="#home">
              Home
            </a>
            <a className="transition-colors hover:text-black" href="#why-us">
              About us
            </a>
            <a className="transition-colors hover:text-black" href="#features">
              Services
            </a>
            <a className="transition-colors hover:text-black" href="#capabilities">
              Features
            </a>
            <a className="transition-colors hover:text-black" href="#solutions">
              Projects
            </a>
          </nav>
          <div className="flex items-center space-x-6 text-base">
            <Link
              href="/login"
              className="hidden font-medium text-gray-800 transition-colors hover:text-black sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              className="motion-button rounded-full border border-gray-800 px-6 py-3 text-sm font-medium tracking-wide transition-all hover:bg-black hover:text-white"
              href="/signup"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION: Background image clearly visible behind hero text with reduced fade */}
        <section className="relative w-full overflow-hidden border-b border-gray-100" id="home">
          {/* Background Hero Image Layer (BEHIND HERO TEXT - Visibility enhanced with reduced fade) */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <ExternalImage
              src={imageUrls.hero}
              alt="Brightloop enterprise headquarters and architecture"
              className="h-full w-full object-cover object-right-top sm:object-center opacity-85 transition-transform duration-1000"
            />
            {/* Soft, reduced-fade gradient overlay: keeps text ultra-readable on the left while revealing the hero image */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/20 sm:w-3/5" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
          </div>

          {/* Foreground Hero Content */}
          <div className="relative z-10 mx-auto max-w-none px-8 py-24 sm:py-32 lg:py-36">
            <div className="max-w-3xl">
              {/* Alive Status Pill */}
              <div className="motion-rise mb-6 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/95 px-4 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Enterprise Subscription Engine & Automated Billing</span>
              </div>

              <h1 className="motion-rise mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-gray-950 sm:text-6xl lg:text-[68px]">
                Manage Your Subscriptions.{" "}
                <span className="block text-gray-800">Simplify Your Business.</span>
              </h1>

              <p className="motion-rise max-w-2xl text-lg leading-relaxed text-gray-700 [animation-delay:120ms] sm:text-xl">
                A complete platform to manage your subscription business, from launching products and creating plans
                to handling recurring billing, tracking payments, and monitoring revenue.
              </p>

              <div className="motion-rise mt-10 flex flex-wrap items-center gap-6 [animation-delay:220ms]">
                <Link
                  className="motion-button rounded-full bg-black px-8 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                  href="/signup"
                >
                  Get Started
                </Link>
                <a
                  className="motion-button rounded-full border border-gray-400 bg-white/95 px-8 py-4 text-sm font-semibold text-gray-900 shadow-sm backdrop-blur-sm transition hover:bg-black hover:text-white"
                  href="#features"
                >
                  Learn more
                </a>
              </div>

              {/* Floating Live Metric Cards for Alive Feel */}
              <div className="motion-float mt-12 inline-flex flex-wrap items-center gap-6 rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-950">99.9% Reliability</div>
                    <div className="text-[11px] text-gray-500 font-medium">Automated Recurring Billing</div>
                  </div>
                </div>
                <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                    ⚡
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-950">Sub-2s Processing</div>
                    <div className="text-[11px] text-gray-500 font-medium">Automated PDF Dispatch</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE BRIGHTLOOP (Scroll Fade-In) */}
        <section className="mx-auto max-w-none px-8 py-28" id="why-us">
          <div className="grid items-center gap-16 lg:grid-cols-12">
            <div className="lg:col-span-6 lg:pr-6">
              <Reveal>
                <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                  Why Choose Brightloop?
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="mb-12 text-lg leading-relaxed text-gray-600">
                  Brightloop eliminates spreadsheet-based tracking, manually generated invoices, missed renewals, and
                  time-consuming financial reporting. Built to handle thousands of subscriptions with sub-2-second response
                  times, automated billing, and strict role-based access control across your entire organization.
                </p>
              </Reveal>
              <div className="grid grid-cols-3 gap-6 border-t border-gray-100 pt-8">
                {[
                  ["99.9%", "Billing Reliability"],
                  ["10k+", "Subscriptions Handled"],
                  ["500+", "Active Workspaces"],
                ].map(([value, label], index) => (
                  <Reveal key={label} delay={180 + index * 90}>
                    <div className="transition-transform hover:scale-105 duration-200">
                      <div className="text-3xl font-bold text-gray-950 sm:text-4xl">{value}</div>
                      <div className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <div className="lg:col-span-6">
              <Reveal delay={150}>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
                  <ExternalImage
                    src={imageUrls.team}
                    alt="Brightloop team collaborating on the subscription platform"
                    className="motion-image h-[500px] w-full object-cover"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* SERVICES (Scroll Fade-In on each service item) */}
        <section className="border-y border-gray-200 bg-gray-50/70 px-8 py-28" id="features">
          <div className="mx-auto max-w-none">
            <Reveal>
              <h2 className="mb-16 text-4xl font-bold tracking-tight text-gray-950">Services</h2>
            </Reveal>
            <div className="space-y-20">
              {services.map((service, index) => (
                <Reveal key={service.title} delay={index * 100}>
                  <div className="grid items-center gap-8 md:grid-cols-12">
                    <div className={`md:col-span-5 ${index % 2 === 1 ? "md:order-2" : ""}`}>
                      <div className="overflow-hidden rounded-xl bg-gray-200 shadow-sm border border-gray-200">
                        <ExternalImage
                          src={service.image}
                          alt={service.alt}
                          className="motion-image aspect-[16/10] h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className={`md:col-span-7 md:pl-10 ${index % 2 === 1 ? "md:order-1" : ""}`}>
                      <h3 className="mb-4 text-2xl font-bold text-gray-900">{service.title}</h3>
                      <p className="max-w-3xl text-lg leading-relaxed text-gray-600">{service.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* SYSTEM CAPABILITIES (Scroll Fade-In) */}
        <section className="mx-auto max-w-none px-8 py-28" id="capabilities">
          <div className="grid items-start gap-16 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Reveal>
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-950">System Capabilities</h2>
                <p className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-600">
                  We provide modular sub-engines for taxes, discounts, lifecycle transitions, and role isolation. Everything
                  is engineered to scale reliably. Explore our capability matrix below.
                </p>
              </Reveal>
              <div className="mb-10 flex items-center gap-6">
                {[
                  [imageUrls.capabilities, "Tax & Discounts"],
                  [imageUrls.product, "Lifecycle"],
                  [imageUrls.access, "Role Access"],
                ].map(([image, label], index) => (
                  <Reveal key={label} delay={index * 120}>
                    <div className="text-center group cursor-pointer">
                      <div className="mb-3 h-28 w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm transition-all group-hover:border-black group-hover:shadow-md">
                        <ExternalImage src={image} alt={label} className="h-full w-full object-cover motion-image" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-black">{label}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={250}>
                <Link
                  className="motion-button inline-block rounded-md border border-gray-900 px-6 py-3 text-sm font-semibold transition hover:bg-black hover:text-white"
                  href="/signup"
                >
                  Start Free Trial
                </Link>
              </Reveal>
            </div>
            <div className="lg:col-span-6">
              <Reveal delay={150}>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
                  <ExternalImage
                    src={imageUrls.capabilities}
                    alt="High throughput enterprise cloud processing facility"
                    className="motion-image h-[500px] w-full object-cover"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* RECENT PROJECTS / WORKSPACES (Scroll Fade-In) */}
        <section className="border-t border-gray-200 bg-gray-50/70 px-8 py-28" id="solutions">
          <div className="mx-auto max-w-none">
            <Reveal>
              <div className="mb-14">
                <h2 className="mb-3 text-4xl font-bold tracking-tight text-gray-950">Recent Projects</h2>
                <p className="text-lg text-gray-500">
                  Here are 3 of our core solution portals engineered for administrators, operations staff, and paying subscribers.
                </p>
              </div>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-3">
              {projects.map((project, index) => (
                <Reveal key={project.title} delay={index * 120}>
                  <article className="motion-card flex flex-col justify-between rounded-xl border border-gray-200/90 bg-white p-6 shadow-sm h-full">
                    <div>
                      <div className="mb-6 aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                        <ExternalImage
                          src={project.image}
                          alt={project.alt}
                          className="motion-image h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-gray-900">{project.title}</h3>
                      <p className="mb-8 text-base leading-relaxed text-gray-500">{project.description}</p>
                    </div>
                    <Link
                      href={project.href}
                      className="motion-button w-fit rounded-md border border-gray-800 px-5 py-2 text-sm font-medium transition hover:bg-black hover:text-white"
                    >
                      Open Portal
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION (Scroll Fade-In) */}
        <section className="mx-auto max-w-none px-8 py-24" id="cta">
          <Reveal>
            <div className="motion-card rounded-2xl border border-gray-200 bg-gray-100 p-14 text-left sm:p-20 shadow-sm">
              <h2 className="mb-3 text-3xl font-bold text-gray-950 sm:text-4xl">Have any upcoming projects?</h2>
              <p className="mb-8 text-lg text-gray-600 max-w-2xl">
                Explore how Brightloop can turn your vision into reality with our automated subscription billing platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="motion-button rounded-md bg-black px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="motion-button rounded-md border border-gray-800 px-7 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-black hover:text-white"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* FOOTER (Cleaned up, no false info) */}
      <footer className="bg-black px-8 pb-12 pt-16 text-gray-300">
        <div className="mx-auto max-w-none">
          <Reveal>
            <div className="grid gap-10 border-b border-gray-800 pb-12 md:grid-cols-12">
              <div className="space-y-5 md:col-span-5">
                <Logo inverted />
                <p className="text-xs text-gray-400 max-w-sm pt-2 leading-relaxed">
                  Autonomous subscription management and recurring billing platform engineered for high-velocity software
                  and services businesses.
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  All billing engines operational
                </div>
              </div>
              <div className="space-y-3 text-xs md:col-span-2">
                <div className="font-semibold text-white uppercase tracking-wider mb-2">Navigation</div>
                <a className="block hover:text-white transition-colors" href="#home">
                  Home
                </a>
                <a className="block hover:text-white transition-colors" href="#why-us">
                  About us
                </a>
                <a className="block hover:text-white transition-colors" href="#features">
                  Services
                </a>
              </div>
              <div className="space-y-3 text-xs md:col-span-2">
                <div className="font-semibold text-white uppercase tracking-wider mb-2">Platform</div>
                <a className="block hover:text-white transition-colors" href="#capabilities">
                  Features
                </a>
                <a className="block hover:text-white transition-colors" href="#solutions">
                  Projects
                </a>
                <Link className="block hover:text-white transition-colors" href="/dashboard">
                  Admin Console
                </Link>
              </div>
              <div className="space-y-3 text-xs md:col-span-3">
                <div className="font-semibold text-white uppercase tracking-wider mb-2">Access</div>
                <Link className="block hover:text-white transition-colors" href="/login">
                  Staff Billing Portal
                </Link>
                <Link className="block hover:text-white transition-colors" href="/my-subscriptions">
                  Customer Dashboard
                </Link>
                <div className="pt-2">
                  <Link
                    className="inline-block rounded-full border border-gray-600 px-5 py-2 text-xs text-white transition hover:border-white hover:bg-white hover:text-black"
                    href="/signup"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
            <div>© {new Date().getFullYear()} Brightloop Inc. All rights reserved.</div>
            <div className="flex items-center space-x-6">
              <a href="#home" className="hover:text-gray-400 transition-colors">Privacy</a>
              <a href="#home" className="hover:text-gray-400 transition-colors">Terms</a>
              <a href="#home" className="hover:text-gray-400 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
