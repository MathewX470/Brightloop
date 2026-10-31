const pipeline = [
  { title: "Contacted", color: "bg-[#72b88e]", companies: ["ByteBridge", "AI Synergy"] },
  { title: "Negotiation", color: "bg-[#f3b936]", companies: ["SkillUp Hub", "Thera Well"] },
  { title: "Offer Sent", color: "bg-[#61a8cf]", companies: ["FitLife Nutrition", "Prime Estate"] },
  { title: "Deal Closed", color: "bg-[#3c9b68]", companies: ["CloudSphere", "Advantage Medi"] },
];

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7m0 0H8m9 0v9" />
    </svg>
  );
}

function Check() {
  return (
    <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0f1f17] font-sans text-[#f1f8ed]">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_78%_4%,rgba(167,215,181,0.2),transparent_29%),radial-gradient(circle_at_7%_42%,rgba(73,121,94,0.14),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
        <nav className="flex items-center justify-between border-b border-white/10 py-6">
          <a href="#" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#a7d7b5] text-[#0f1f17]">✦</span>
            SOUL
          </a>
          <div className="hidden items-center gap-8 text-sm text-[#d3e2d3] md:flex">
            <a className="transition-colors hover:text-white" href="#product">Product</a>
            <a className="transition-colors hover:text-white" href="#features">Features</a>
            <a className="transition-colors hover:text-white" href="#pricing">Pricing</a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a className="hidden px-3 py-2 text-[#d3e2d3] hover:text-white sm:block" href="#login">Log in</a>
            <a className="rounded-full bg-[#f1f8ed] px-4 py-2.5 font-semibold text-[#0f1f17] transition-transform hover:scale-105" href="#start">
              Get started
            </a>
          </div>
        </nav>

        <section className="grid items-center gap-12 pb-20 pt-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:pb-28 lg:pt-24">
          <div className="max-w-xl">
            <p className="mb-6 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-[#a7d7b5]">
              <span className="h-2 w-2 rounded-full bg-[#a7d7b5]" /> Built for better business
            </p>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#f1f8ed] sm:text-6xl lg:text-[76px]">
              Grow relationships.
              <span className="block text-[#a7d7b5]">Close deals.</span>
            </h1>
            <p className="mt-7 max-w-md text-lg leading-8 text-[#b8cdbb]">
              BizLink keeps your customers, tasks, and opportunities moving forward in one beautifully simple workspace.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#start" className="flex items-center gap-2 rounded-full bg-[#a7d7b5] px-6 py-3.5 font-semibold text-[#0f1f17] transition-all hover:bg-[#c1e6c8]">
                Start for free <ArrowUpRight />
              </a>
              <a href="#product" className="rounded-full border border-white/20 px-6 py-3.5 font-medium text-[#e3ede5] transition-colors hover:border-[#a7d7b5]">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-5 text-sm text-[#9eb3a1]">
              <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#a7d7b5] text-[#0f1f17]"><Check /></span> No credit card</span>
              <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#a7d7b5] text-[#0f1f17]"><Check /></span> Free 14-day trial</span>
            </div>
          </div>

          <div id="product" className="relative rounded-[26px] border border-white/20 bg-[#f1f8ed] p-2 shadow-2xl shadow-black/30 sm:p-3">
            <div className="overflow-hidden rounded-[19px] border border-[#dce9d9] bg-[#f9fcf6] text-[#18271f]">
              <div className="flex h-12 items-center gap-2 border-b border-[#e3ede0] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#e89b82]" /><span className="h-2.5 w-2.5 rounded-full bg-[#e9c36b]" /><span className="h-2.5 w-2.5 rounded-full bg-[#7cbe89]" />
                <div className="mx-auto hidden rounded-md bg-[#edf4eb] px-20 py-1 text-[10px] text-[#829187] sm:block">app.bizlink.com</div>
              </div>
              <div className="grid min-h-[360px] grid-cols-[116px_1fr] sm:grid-cols-[154px_1fr]">
                <aside className="border-r border-[#e3ede0] bg-[#f5f9f2] p-3 sm:p-4">
                  <div className="mb-8 flex items-center gap-1.5 text-sm font-bold"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#a7d7b5] text-[10px]">✦</span> BizLink</div>
                  <p className="mb-2 text-[9px] uppercase tracking-wider text-[#91a094]">Workspace</p>
                  <div className="rounded-lg bg-[#dfeede] px-2 py-2 text-[10px] font-semibold">⌂ &nbsp; Dashboard</div>
                  <div className="px-2 py-2 text-[10px] text-[#718074]">◫ &nbsp; Tasks</div>
                  <div className="px-2 py-2 text-[10px] text-[#718074]">⌁ &nbsp; Activity</div>
                  <div className="px-2 py-2 text-[10px] text-[#718074]">♧ &nbsp; Customers</div>
                  <p className="mb-2 mt-7 text-[9px] uppercase tracking-wider text-[#91a094]">Manage</p>
                  <div className="px-2 py-2 text-[10px] text-[#718074]">◈ &nbsp; Settings</div>
                </aside>
                <div className="bg-[#fbfdf9] p-4 sm:p-6">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] text-[#8a998e]">Monday, April 14</p><h2 className="mt-1 text-base font-semibold sm:text-lg">Good morning, Sandra</h2></div><div className="h-7 w-7 rounded-full bg-[#d29d7e]" /></div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[#eff7ed] p-3"><p className="text-[9px] text-[#839286]">Total customers</p><p className="mt-1 text-xl font-semibold">248</p><p className="mt-1 text-[9px] text-[#409465]">↑ 12.5%</p></div>
                    <div className="rounded-xl bg-[#eff7ed] p-3"><p className="text-[9px] text-[#839286]">Open deals</p><p className="mt-1 text-xl font-semibold">53</p><p className="mt-1 text-[9px] text-[#409465]">↑ 8.2%</p></div>
                    <div className="hidden rounded-xl bg-[#eff7ed] p-3 sm:block"><p className="text-[9px] text-[#839286]">Revenue</p><p className="mt-1 text-xl font-semibold">$15.8k</p><p className="mt-1 text-[9px] text-[#409465]">↑ 18.4%</p></div>
                  </div>
                  <div className="mt-5 flex items-center justify-between"><h3 className="text-xs font-semibold">Deal pipeline</h3><span className="text-[9px] text-[#839286]">This month ˅</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
                    {pipeline.map((stage) => <div key={stage.title} className="rounded-xl border border-[#e5ede3] bg-white p-2.5"><div className="flex items-center justify-between text-[9px] font-semibold"><span>{stage.title}</span><span className={`h-1.5 w-1.5 rounded-full ${stage.color}`} /></div>{stage.companies.map((company) => <div key={company} className="mt-2 rounded-lg bg-[#f6faf4] p-2 text-[9px] text-[#59675d]">{company}<span className="mt-1 block text-[8px] text-[#9aa79d]">$2,400 · Apr 18</span></div>)}</div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-white/10 py-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <p className="max-w-sm text-sm leading-6 text-[#a9bda9]">Everything your team needs to turn meaningful conversations into lasting growth.</p>
            <div className="flex gap-8 text-sm text-[#d7e5d6]"><span><strong className="mr-1 text-xl text-[#a7d7b5]">2.4k+</strong> teams growing</span><span><strong className="mr-1 text-xl text-[#a7d7b5]">98%</strong> retention</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}
