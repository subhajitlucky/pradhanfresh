import {
  ArrowRight,
  Boxes,
  Droplets,
  Handshake,
  Recycle,
  Sprout,
  Store,
  ThermometerSun,
  Tractor,
  Wheat,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, ProseImage, SectionHeading } from '../components/ui/Surface';
import { plural } from '../lib/format';

/* -------------------------------------------------------------------------- */
/*  Content                                                                    */
/* -------------------------------------------------------------------------- */

const IMG = {
  hero: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80',
  yard: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
} as const;

/** Hairline-ruled ledger of eras. */
const ERAS = [
  {
    year: '1974',
    title: 'One cart, one stall',
    body: 'Gopal Pradhan takes a single wooden cart into Pune Market Yard with forty kilos of tomatoes and a handwritten price list. The rule is written on the back of it: sell what is ripe today, never what will be ripe next week.',
  },
  {
    year: '1980s',
    title: 'The stall becomes a shed',
    body: 'Twelve partner farms are supplying the yard by the end of the decade. Ramesh, the second generation, starts grading by hand at 6am because a customer complained about a soft tomato — and never stops.',
  },
  {
    year: '1994',
    title: 'The first cold chain',
    body: 'A refrigerated room goes in behind the shed. It costs more than the shed. It is also the year we stop losing a third of the harvest to heat on the way home, and the reason our repeat customers start telling their friends.',
  },
  {
    year: '2011',
    title: 'Direct from the farm',
    body: 'The trader step is removed. Farmers set their own price and name the farm on the crate, and a website goes up so people outside Pune can order. Volume triples; the yard can barely keep up.',
  },
  {
    year: 'Today',
    title: 'Two hundred farms, same rule',
    body: 'Over 200 partner farms across Maharashtra, a route that leaves before nine, and a delivery promise that has not moved since the first cart: on your table by noon, or we have done it wrong.',
  },
] as const;

const PRACTICES = [
  {
    icon: Recycle,
    title: 'Packing that composts',
    body: 'Jute sacks, plant-fibre trays and paper twine across the whole line. No polystyrene, no cling film, no plastic twist ties — anything that cannot break down in a home compost bin does not enter the yard.',
  },
  {
    icon: Droplets,
    title: 'Wash water, reused',
    body: 'Produce is washed in three cascade tanks, so the final rinse is water that has already been used twice. Roof catchment supplies roughly two-thirds of what the yard uses on a Pune monsoon day.',
  },
  {
    icon: ThermometerSun,
    title: 'Rot routed to compost',
    body: 'Everything rejected at the grading table goes to a compost cooperative in Haveli, not to a landfill. Last year that was 4.1 tonnes — about 11% of everything that came through the yard.',
  },
  {
    icon: Wheat,
    title: 'Soil over yield',
    body: 'Partner farms are paid on a three-year rotation contract, not on what they can pull out of a plot in one season. A farm that is not growing well gets compost and advice before it gets a lower price.',
  },
] as const;

/** Illustrative partner tiles — representative, not a directory. */
const PARTNERS = [
  {
    name: 'Wadgaon tomato belt',
    place: 'Wadgaon, Pune',
    since: 'Partner since 1984',
    img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=700&q=80',
    alt: 'Ripe tomatoes still on the vine',
  },
  {
    name: 'Mulshi greens',
    place: 'Mulshi, Pune',
    since: 'Partner since 1996',
    img: 'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?auto=format&fit=crop&w=700&q=80',
    alt: 'Leafy greens gathered into a crate',
  },
  {
    name: 'Satara seasonal orchards',
    place: 'Satara, Maharashtra',
    since: 'Partner since 2003',
    img: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=700&q=80',
    alt: 'Fresh fruit from a seasonal orchard',
  },
  {
    name: 'Nashik grape rows',
    place: 'Nashik, Maharashtra',
    since: 'Partner since 2009',
    img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=700&q=80',
    alt: 'Grapes ripening in rows',
  },
  {
    name: 'Ahmednagar millets',
    place: 'Ahmednagar, Maharashtra',
    since: 'Partner since 2014',
    img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80',
    alt: 'Millet heads ripening in a field',
  },
  {
    name: 'Junnar market gardens',
    place: 'Junnar, Pune',
    since: 'Partner since 2017',
    img: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=700&q=80',
    alt: 'A grower working between rows of crops',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function About() {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/*  (a) Hero + founding note                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-rule">
        <div className="grid items-center lg:grid-cols-[minmax(0,46%)_1fr]">
          <div className="relative order-1 h-[17rem] w-full sm:h-[22rem] lg:order-2 lg:h-[30rem] lg:min-h-[34rem]">
            <ProseImage
              src={IMG.hero}
              alt="A grower standing in a field at first light, holding a crate of greens"
              className="size-full"
              imgClassName="saturate-[0.86] contrast-[1.05]"
              loading="eager"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/45 via-transparent to-ember/10 mix-blend-multiply"
            />
          </div>

          <div className="shell order-2 py-14 md:py-20 lg:order-1 lg:py-24 lg:pr-16">
            <span className="eyebrow">Our story</span>
            <h1 className="mt-6 text-5xl leading-[0.98] tracking-[-0.025em] md:text-6xl lg:text-7xl">
              Fifty years of{' '}
              <span className="italic text-ember">one rule</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-2">
              PradhanFresh began in 1974 as a single cart in Pune Market Yard. It is now a
              family market of {plural(200, 'partner farm', 'partner farms')} across Maharashtra —
              and the rule on the back of that first cart has not changed.
            </p>

            <blockquote className="mt-8 border-l-2 border-ember pl-5">
              <p className="font-display text-xl italic leading-snug text-ink md:text-2xl">
                &ldquo;Sell what is ripe today. Never sell what will be ripe next week.&rdquo;
              </p>
              <footer className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
                Gopal Pradhan · founder
              </footer>
            </blockquote>

            <nav aria-label="On this page" className="mt-9 flex flex-wrap gap-x-6 gap-y-2">
              <a
                href="#generations"
                className="wipe font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:text-ember"
              >
                Three generations
              </a>
              <a
                href="#promise"
                className="wipe font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:text-ember"
              >
                Sustainability
              </a>
              <a
                href="#partners"
                className="wipe font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:text-ember"
              >
                Partner farms
              </a>
            </nav>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  (b) Three generations, one rule                                  */}
      {/* ---------------------------------------------------------------- */}
      <section id="generations" className="scroll-mt-28 border-b border-rule bg-paper-card">
        <div className="shell py-16 md:py-24">
          <SectionHeading
            eyebrow="The ledger"
            title="Three generations, one rule"
            lede="The carts changed size. The cold chain, the website and the route all arrived eventually. The rule did not."
          />

          <ol className="mt-12 border-t border-rule md:mt-16">
            {ERAS.map((era, i) => (
              <li
                key={era.year}
                className="stagger grid gap-x-10 gap-y-3 border-b border-rule py-8 md:grid-cols-[10rem_1fr]"
                style={{ '--i': i } as never}
              >
                <p className="tnum font-display text-3xl font-semibold leading-none text-ember md:text-4xl">
                  {era.year}
                </p>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink md:text-2xl">
                    {era.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
                    {era.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  (c) #promise — sustainability                                     */}
      {/* ---------------------------------------------------------------- */}
      <section id="promise" className="scroll-mt-28 border-b border-rule">
        <div className="shell py-16 md:py-24">
          <SectionHeading
            eyebrow="Our promise"
            title="What we are actually doing about it"
            lede="Sustainability is mostly packaging claims and fine print. Here are the four things we have actually changed at the yard, and what they cost us."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 md:mt-16">
            {PRACTICES.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} className="flex flex-col p-6 md:p-7">
                  <span className="grid size-11 place-items-center rounded-md bg-leaf-soft text-leaf-deep">
                    <Icon className="size-5" aria-hidden strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{p.body}</p>
                </Card>
              );
            })}
          </div>

          <p className="mt-10 max-w-2xl border-t border-rule pt-6 text-sm leading-relaxed text-ink-3">
            We are not carbon neutral and we do not claim to be. We compost, we cut plastic and
            we pay farms on rotation contracts. If you have a question about any of it, the
            yard is open six days a week and so is our phone.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  (d) #partners — partner farms                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="partners" className="scroll-mt-28 border-b border-rule bg-paper-deep">
        <div className="shell py-16 md:py-24">
          <SectionHeading
            eyebrow="The partners"
            title="Two hundred farms, and the ones we visit most"
            lede="A representative sample of the regions we buy from. None of them are brokers — every farm here has a person whose name is on the crate."
          />

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
            {PARTNERS.map((farm, i) => (
              <Card key={farm.name} as="li" interactive className="stagger overflow-hidden" style={{ '--i': i } as never}>
                <ProseImage
                  src={farm.img}
                  alt={farm.alt}
                  className="aspect-[4/3] w-full"
                />
                <div className="p-5">
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ember">
                    {farm.since}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">{farm.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-3">
                    <Store className="size-3.5 shrink-0" aria-hidden />
                    {farm.place}
                  </p>
                </div>
              </Card>
            ))}
          </ul>

          <div className="mt-12 grid gap-px overflow-hidden rounded-lg bg-rule sm:grid-cols-3">
            {[
              { icon: Tractor, k: '200+', v: 'Partner farms across Maharashtra' },
              { icon: Handshake, k: '3-year', v: 'Rotation contracts, not one-season deals' },
              { icon: Boxes, k: '150 km', v: 'The furthest farm we buy from' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.k} className="bg-paper-card px-6 py-8">
                  <Icon className="size-5 text-ember" aria-hidden strokeWidth={1.8} />
                  <p className="tnum mt-4 font-display text-3xl font-semibold text-ink">{s.k}</p>
                  <p className="mt-1 text-sm leading-snug text-ink-3">{s.v}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  (e) Closing CTA                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        {/* ProseImage hard-codes `relative`, so the bleed layer is a wrapper. */}
        <div aria-hidden className="absolute inset-0">
          <ProseImage src={IMG.yard} alt="" className="size-full" imgClassName="saturate-[0.7]" />
        </div>
        <span aria-hidden className="absolute inset-0 bg-paper/88" />

        <div className="shell relative py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Next step</span>
            <h2 className="mt-4 text-4xl leading-[1.04] sm:text-5xl">
              Meet them at the market
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-2">
              Order online and we will pick it for you. Or come to Market Yard at six in the
              morning, when the crates are still open.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                to="/products"
                variant="ember"
                size="lg"
                rightIcon={<ArrowRight className="size-4" aria-hidden />}
              >
                Browse today&rsquo;s harvest
              </Button>
              <Button
                to="/contact"
                variant="outline"
                size="lg"
                leftIcon={<Sprout className="size-4" aria-hidden />}
              >
                Plan a market visit
              </Button>
            </div>
            <p className="mt-6 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
              14 Market Yard, Pune 411001 · Open 6 am – 2 pm
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
