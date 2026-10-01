import { ArrowRight, Leaf, PackageCheck, Recycle, ScanLine, Sprout, Sun, Truck } from 'lucide-react';
import { ProductGrid } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { ProseImage, SectionHeading, Stat } from '../components/ui/Surface';
import { useFeaturedProducts } from '../lib/catalog';
import { money, plural } from '../lib/format';

/* -------------------------------------------------------------------------- */
/*  Content                                                                    */
/* -------------------------------------------------------------------------- */

/** Editorial photography. No local asset ships with the app, so these are
 *  remote crops sized for the slot they fill and handled by <ProseImage>. */
const IMG = {
  hero: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1400&q=80',
  band: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80',
} as const;

const LEDGER = [
  { label: 'Harvested daily', value: '5:30 am', note: 'Crate out of the field' },
  { label: 'Home by', value: 'Noon', note: 'Across Pune' },
  { label: 'Partner farms', value: '200+', note: 'Across Maharashtra' },
  { label: 'Family run since', value: '1974', note: 'Three generations' },
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Harvest',
    icon: Sprout,
    time: '5:30 am',
    body: 'Farm hands cut at first light, while the field is still cool. Nothing waits in a warehouse for a delivery slot.',
  },
  {
    n: '02',
    title: 'Sort',
    icon: ScanLine,
    time: '6:15 am',
    body: 'Every crate is opened and graded by hand at Market Yard. Bruised and off-spec produce goes to the compost yard, not to you.',
  },
  {
    n: '03',
    title: 'Pack',
    icon: PackageCheck,
    time: '8:00 am',
    body: 'Picked clean, weighed honest, wrapped in breathable jute and plant-fibre trays. No plastic, no ice, no cold-air freight.',
  },
  {
    n: '04',
    title: 'Deliver',
    icon: Truck,
    time: 'By noon',
    body: 'Out the door by ten. Free over ₹500, and every crate is weighed again in front of you.',
  },
] as const;

const PROMISES = [
  {
    icon: Leaf,
    title: 'Cut out the middleman',
    body: 'Farmers set their own price and we take a flat market fee. No trader buys your produce three times over before you see it.',
  },
  {
    icon: Recycle,
    title: 'Packing that composts',
    body: 'Jute sacks, plant-fibre trays, paper twine. Everything we pack with breaks down in a home compost bin within a season.',
  },
  {
    icon: Sun,
    title: 'Seasonal, not shipped',
    body: 'What is in season grows within 150 km of Pune. When a crop is out of season we say so instead of air-freighting it.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const { data: featured, isPending } = useFeaturedProducts(8);

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/*  1 — Hero                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-rule">
        <div className="grid min-h-[88vh] items-center lg:grid-cols-[1fr_minmax(0,42%)]">
          {/* Left — the words */}
          <div className="order-2 lg:order-1">
            <div className="shell py-14 md:py-20 lg:py-24 lg:pr-16">
              <span className="eyebrow">Pune · Since 1974</span>

              <h1 className="mt-6 text-6xl leading-[0.95] tracking-[-0.03em] md:text-7xl lg:text-8xl">
                Picked at <span className="italic text-ember">dawn.</span>
                <br />
                On your table by noon.
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-2">
                Two hundred partner farms across Maharashtra, one market yard in Pune, and a
                delivery route that leaves before the traffic does. What you order was on a
                stalk this morning.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button
                  to="/products"
                  variant="ink"
                  size="lg"
                  rightIcon={<ArrowRight className="size-4" aria-hidden />}
                >
                  Shop today&rsquo;s harvest
                </Button>
                <Button to="/about" variant="outline" size="lg">
                  Our story since 1974
                </Button>
              </div>

              <p className="mt-7 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
                Free delivery over {money(500)} · GST included at 18%
              </p>
            </div>
          </div>

          {/* Right — the plate */}
          <div className="relative order-1 lg:order-2">
            <div className="relative h-[19rem] w-full sm:h-[26rem] lg:h-full lg:min-h-[88vh]">
              <ProseImage
                src={IMG.hero}
                alt="Crate of tomatoes and greens on a market bench, lit by early morning sun"
                className="size-full"
                imgClassName="saturate-[0.88] contrast-[1.06]"
                loading="eager"
              />
              {/* Duotone wash — paper ground into the shadows, ember into the light */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/55 via-transparent to-ember/10 mix-blend-multiply"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 border-l border-rule"
              />
            </div>

            {/* Floating stat chip — CSS-only sway; reduced motion is handled globally */}
            <div className="pointer-events-none absolute bottom-6 left-4 lg:bottom-12 lg:-left-10">
              <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-rule bg-paper-card px-4 py-3 shadow-float animate-[sway_7s_ease-in-out_infinite]">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-ember-soft text-ember-deep">
                  <Sun className="size-5" aria-hidden />
                </span>
                <span className="leading-tight">
                  <span className="block font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-3">
                    Harvest begins
                  </span>
                  <span className="tnum block font-display text-lg font-semibold text-ink">
                    5:30 am, every day
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  2 — Ledger strip                                                */}
      {/* ---------------------------------------------------------------- */}
      <section aria-label="PradhanFresh at a glance" className="border-b border-rule bg-paper-deep">
        <div className="shell grid grid-cols-2 gap-y-9 py-11 md:grid-cols-4 md:divide-x md:divide-rule md:gap-y-0">
          {LEDGER.map((s, i) => (
            <div key={s.label} className="md:px-6 md:first:pl-0 md:last:pr-0">
              <Stat label={s.label} value={s.value} note={s.note} index={i} tone="ink" />
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  3 — Featured produce                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="shell py-16 md:py-24">
        <SectionHeading
          eyebrow="This morning’s crates"
          title={
            <>
              What came in
              <br />
              from the fields
            </>
          }
          lede={
            featured
              ? `${plural(featured.length, 'item')} featured today, chosen at Market Yard when the crates were opened.`
              : 'Opening today’s crates at Market Yard…'
          }
          action={
            <Button
              to="/products"
              variant="outline"
              rightIcon={<ArrowRight className="size-4" aria-hidden />}
            >
              Browse all produce
            </Button>
          }
        />

        <div className="mt-10 md:mt-12" aria-busy={isPending}>
          <span role="status" aria-live="polite" className="sr-only">
            {featured
              ? `${plural(featured.length, 'featured item')} loaded.`
              : 'Loading featured produce.'}
          </span>
          {featured ? <ProductGrid products={featured} /> : <ProductGrid skeletonCount={8} />}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  4 — How it gets to you                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-rule bg-paper-card">
        <div className="shell py-16 md:py-24">
          <SectionHeading
            eyebrow="The route"
            title="Four hands between the soil and your kitchen"
            lede="Six and a half hours, from stalk to doorstep. Here is where every one of them goes."
          />

          <ol className="mt-12 border-t border-rule md:mt-16">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.n}
                  className="group grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-3 border-b border-rule py-8 md:grid-cols-[7rem_1fr_18rem] md:gap-x-10"
                >
                  <span
                    aria-hidden
                    className="tnum font-display text-5xl font-semibold leading-none text-ink-3 transition-colors duration-300 group-hover:text-ember md:text-6xl"
                  >
                    {step.n}
                  </span>

                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink md:text-3xl">
                      <Icon className="size-5 shrink-0 text-ember" aria-hidden strokeWidth={1.8} />
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-2">
                      {step.body}
                    </p>
                  </div>

                  <p className="col-start-2 self-center justify-self-start font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3 md:col-start-3 md:justify-self-end">
                    {step.time}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  5 — Promise (inverted band)                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-paper-ink py-16 text-paper md:py-24">
        <div className="shell">
          <div className="max-w-2xl">
            {/* The .eyebrow primitive defaults to ember, which only reaches 2.9:1
                on the ink band — citrus is the accent for dark grounds. */}
            <span className="eyebrow text-citrus">Why us</span>
            <h2 className="mt-4 text-4xl leading-[1.02] text-paper sm:text-5xl">
              Three promises we have kept since 1974
            </h2>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-lg bg-paper/15 sm:grid-cols-3 md:mt-16">
            {PROMISES.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="bg-paper-ink px-6 py-9 md:px-8 md:py-11">
                  <Icon className="size-7 text-citrus" aria-hidden strokeWidth={1.6} />
                  <h3 className="mt-5 text-2xl leading-tight text-paper">{p.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-paper/70">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  6 — Testimonial                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-rule bg-paper">
        <figure className="shell py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span aria-hidden className="font-display text-6xl leading-none text-ember">
              &ldquo;
            </span>
            <blockquote className="mt-2">
              <p className="font-display text-3xl italic leading-[1.18] text-ink sm:text-4xl md:text-[2.75rem] md:leading-[1.15]">
                The tomatoes still taste of the field. I have stopped buying them anywhere else —
                and I have never once had to ask when they were picked.
              </p>
            </blockquote>
            <figcaption className="mt-8 flex flex-col items-center gap-1">
              <span className="font-display text-lg font-semibold text-ink">Meera Joshi</span>
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
                Customer since 2019 · Kothrud, Pune
              </span>
            </figcaption>
          </div>
        </figure>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  7 — CTA band                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        {/* ProseImage hard-codes `relative`, so the bleed layer is a wrapper. */}
        <div aria-hidden className="absolute inset-0">
          <ProseImage src={IMG.band} alt="" className="size-full" imgClassName="saturate-[0.7]" />
        </div>
        <span aria-hidden className="absolute inset-0 bg-paper/88" />

        <div className="shell relative py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">One letter a week</span>
            <h2 className="mt-4 text-4xl leading-[1.04] sm:text-5xl">
              Know what was harvested before it reaches you
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-2">
              The harvest letter goes out every Sunday morning: which farm grew what, what is
              running short, and what we are picking up from the yard on Monday.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button to="/products" variant="ember" size="lg">
                Start your first order
              </Button>
              <Button to="/contact" variant="outline" size="lg">
                Visit the market yard
              </Button>
            </div>
            <p className="mt-6 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-3">
              Free delivery over {money(500)} · No subscription fee
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
