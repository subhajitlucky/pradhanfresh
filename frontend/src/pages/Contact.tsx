import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Field';
import { useToast } from '../components/ui/Feedback';
import { SectionHeading } from '../components/ui/Surface';
import { cn } from '../lib/format';

/* -------------------------------------------------------------------------- */
/*  Contact details                                                            */
/* -------------------------------------------------------------------------- */

const ADDRESS = {
  line1: '14 Market Yard',
  line2: 'Gultekdi',
  city: 'Pune',
  pin: '411001',
  state: 'Maharashtra',
} as const;

const PHONE_HREF = 'tel:+919876543210';
const PHONE_DISPLAY = '+91 98765 43210';
const EMAIL = 'hello@pradhanfresh.com';
const MAILBOX = `mailto:${EMAIL}`;

/** Opens Google Maps on a search rather than a pin we would have to keep current. */
const DIRECTIONS =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(`${ADDRESS.line1}, ${ADDRESS.city} ${ADDRESS.pin}, ${ADDRESS.state}`);

const HOURS = [
  { day: 'Monday – Friday', time: '6:00 am – 2:00 pm' },
  { day: 'Saturday', time: '6:00 am – 3:00 pm' },
  { day: 'Sunday', time: '6:00 am – 11:00 am' },
  { day: 'Public holidays', time: 'Closed' },
] as const;

const SUBJECTS = [
  { value: 'order', label: 'About an order' },
  { value: 'delivery', label: 'Delivery or a missed slot' },
  { value: 'wholesale', label: 'Wholesale and restaurants' },
  { value: 'farm', label: 'Becoming a partner farm' },
  { value: 'feedback', label: 'Feedback or a complaint' },
  { value: 'visit', label: 'Visiting the market yard' },
  { value: 'other', label: 'Something else' },
] as const;

const SUBJECT_LABEL: Record<string, string> = Object.fromEntries(
  SUBJECTS.map((s) => [s.value, s.label]),
);

const FAQ = [
  {
    q: 'What time does my order arrive?',
    a: 'Orders placed before 9 am are on the morning route and arrive between 10:30 am and noon. Anything after 9 am goes out on the same afternoon route, typically 2 pm to 6 pm. You will get a message when the crate is loaded.',
  },
  {
    q: 'How is produce kept fresh between the farm and my kitchen?',
    a: 'We harvest at 5:30 am, grade at the yard by 6:15, and pack in breathable jute and plant-fibre trays rather than sealed plastic. No produce spends a night in a warehouse, which is why the shelf life you get at home is longer than you would expect.',
  },
  {
    q: 'Do I pay GST on top of the listed price?',
    a: 'No. Every price on the site already includes 18% GST. Delivery is ₹40 on orders under ₹500 and free at ₹500 and above, and we only start the ₹40 once your basket is above zero.',
  },
  {
    q: 'Can I change or cancel an order after placing it?',
    a: 'Yes, as long as the crate has not been graded. Call the market on ' + PHONE_DISPLAY + ' before 10 am on the day of delivery, or cancel from your order page, and we will sort the rest.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Form state and validation                                                  */
/* -------------------------------------------------------------------------- */

interface FormValues {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = { name: '', email: '', phone: '', subject: 'order', message: '' };

const MAX_MESSAGE = 1200;

/** Indian mobile: optional +91, then 10 digits starting 6–9, tolerating spaces. */
const PHONE_RE = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {};

  const name = v.name.trim();
  if (!name) e.name = 'Tell us who to reply to.';
  else if (name.length < 2) e.name = 'That looks a little short — please enter your name.';

  const email = v.email.trim();
  if (!email) e.email = 'We need an email to reply to.';
  else if (!EMAIL_RE.test(email)) e.email = 'That does not look like an email address.';

  const phone = v.phone.trim();
  if (!phone) e.phone = 'A phone number helps us sort out an order faster.';
  else if (!PHONE_RE.test(phone.replace(/[\s-]/g, '')))
    e.phone = 'Enter a 10-digit Indian mobile number.';

  if (!v.subject) e.subject = 'Pick the closest topic.';
  else if (!SUBJECT_LABEL[v.subject]) e.subject = 'Pick the closest topic.';

  const message = v.message.trim();
  if (!message) e.message = 'Your message is empty.';
  else if (message.length < 15) e.message = 'A little more detail helps us answer properly.';
  else if (message.length > MAX_MESSAGE)
    e.message = `Please keep it under ${MAX_MESSAGE} characters.`;

  return e;
}

/** Builds the mailto: fallback from exactly what the visitor typed. */
function mailtoFor(v: FormValues): string {
  const subject = `PradhanFresh — ${SUBJECT_LABEL[v.subject] ?? 'Enquiry'}`;
  const body = [
    `Name: ${v.name.trim()}`,
    `Email: ${v.email.trim()}`,
    `Phone: ${v.phone.trim()}`,
    '',
    v.message.trim(),
  ].join('\n');
  return `${MAILBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Contact() {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<FormValues | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formId = useId();
  const { notify } = useToast();

  const set = (key: keyof FormValues) => (v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    // Clear the error as soon as the visitor starts fixing it.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(values);

    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      // Move focus to the summary so the failure is announced, not just coloured.
      window.requestAnimationFrame(() => summaryRef.current?.focus());
      notify('Please fix the highlighted fields.', 'error');
      return;
    }

    setErrors({});
    setSubmitted(values);
    notify('Your message is ready — open it in your email app to send.');
  };

  const reset = () => {
    setValues(EMPTY);
    setErrors({});
    setSubmitted(null);
  };

  const errorList = (Object.keys(errors) as Array<keyof FormValues>).filter(
    (k) => errors[k],
  );

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/*  Hero                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-rule">
        <div className="shell py-14 md:py-20">
          <span className="eyebrow">Visit or write</span>
          <h1 className="mt-5 max-w-3xl text-5xl leading-[1] md:text-6xl">
            Talk to the people who{' '}
            <span className="italic text-ember">open the crates</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
            Questions about an order, a bill, a restaurant supply, or a farm that wants to
            partner with us — the market answers its own phone between 6 am and 2 pm.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  Details + form                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-rule bg-paper-card">
        <div className="shell grid gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          {/* ---------------------------- Left: the details ---------- */}
          <div>
            <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-3">
              The market yard
            </h2>

            <address className="mt-5 flex items-start gap-3 not-italic">
              <MapPin className="mt-1 size-5 shrink-0 text-ember" aria-hidden />
              <div className="text-[0.9375rem] leading-relaxed text-ink-2">
                <p className="font-display text-xl font-semibold text-ink">{ADDRESS.line1}</p>
                <p>{ADDRESS.line2}</p>
                <p>
                  {ADDRESS.city} {ADDRESS.pin}
                </p>
                <p>{ADDRESS.state}</p>
                <p className="mt-3">
                  <a
                    href={DIRECTIONS}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="wipe inline-flex items-center gap-1.5 font-medium text-ember transition-colors hover:text-ember-deep"
                  >
                    Get directions
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                    <span className="sr-only">(opens Google Maps in a new tab)</span>
                  </a>
                </p>
              </div>
            </address>

            <dl className="mt-9 space-y-4 border-t border-rule pt-8">
              <div className="flex items-start gap-3">
                <dt className="shrink-0">
                  <Phone className="mt-0.5 size-5 text-ember" aria-hidden />
                  <span className="sr-only">Phone</span>
                </dt>
                <dd>
                  <a
                    href={PHONE_HREF}
                    className="wipe text-[0.9375rem] font-medium text-ink transition-colors hover:text-ember"
                  >
                    {PHONE_DISPLAY}
                  </a>
                  <span className="block text-sm text-ink-3">
                    6 am – 2 pm, Monday to Saturday
                  </span>
                </dd>
              </div>

              <div className="flex items-start gap-3">
                <dt className="shrink-0">
                  <Mail className="mt-0.5 size-5 text-ember" aria-hidden />
                  <span className="sr-only">Email</span>
                </dt>
                <dd>
                  <a
                    href={MAILBOX}
                    className="wipe break-all text-[0.9375rem] font-medium text-ink transition-colors hover:text-ember"
                  >
                    {EMAIL}
                  </a>
                  <span className="block text-sm text-ink-3">
                    Answered within one working day
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-9 border-t border-rule pt-8">
              <h3 className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-3">
                <Clock className="size-3.5" aria-hidden />
                Market hours
              </h3>
              <dl className="mt-4 divide-y divide-rule-soft">
                {HOURS.map((h) => (
                  <div key={h.day} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-sm text-ink-2">{h.day}</dt>
                    <dd className="tnum font-mono text-sm text-ink">{h.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-ink-3">
                Crates are graded from 6:15 am. If you want to watch the sorting, come before
                seven.
              </p>
            </div>
          </div>

          {/* ---------------------------- Right: the form ------------ */}
          <div>
            <h2 className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-3">
              Send us a message
            </h2>

            {/* Success state ------------------------------------------------ */}
            {submitted ? (
              <div
                role="status"
                aria-live="polite"
                className="mt-5 rounded-lg border border-ok bg-leaf-soft px-6 py-8"
              >
                <CheckCircle2 className="size-8 text-ok" aria-hidden />
                <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
                  Thanks, {submitted.name.trim().split(/\s+/)[0]} — your message is ready.
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                  We keep this form on this page rather than on a server, so nothing has been
                  sent yet. Open the message below in your email app and it will arrive at our
                  inbox with everything you typed.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href={mailtoFor(submitted)} variant="ink" leftIcon={<Send className="size-4" aria-hidden />}>
                    Open in my email app
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Write another message
                  </Button>
                </div>
                <p className="mt-5 border-t border-ok/25 pt-4 text-sm leading-relaxed text-ink-3">
                  Email does not open? Copy it to{' '}
                  <a href={MAILBOX} className="wipe font-medium text-ember">
                    {EMAIL}
                  </a>{' '}
                  or call {PHONE_DISPLAY}.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="mt-5">
                {/* Honest framing — there is no contact endpoint behind this form. */}
                <p className="flex items-start gap-2.5 rounded-md border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink-2">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden />
                  <span>
                    This form runs entirely in your browser — we have not built a server to
                    receive it yet. Write your message, then send it through your own email app.
                  </span>
                </p>

                {/* Error summary ------------------------------------------- */}
                {errorList.length > 0 && (
                  <div
                    ref={summaryRef}
                    role="alert"
                    tabIndex={-1}
                    className="mt-5 rounded-md border border-bad bg-ember-soft px-4 py-3.5 outline-none"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-bad">
                      <AlertCircle className="size-4 shrink-0" aria-hidden />
                      {errorList.length === 1
                        ? 'One field needs attention'
                        : `${errorList.length} fields need attention`}
                    </p>
                    <ul className="mt-2 space-y-1 pl-6 text-sm text-bad">
                      {errorList.map((k) => (
                        <li key={k} className="list-disc">
                          {errors[k]}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Input
                    name="name"
                    label="Your name"
                    required
                    autoComplete="name"
                    value={values.name}
                    onChange={(e) => set('name')(e.target.value)}
                    error={errors.name}
                    placeholder="Meera Joshi"
                  />
                  <Input
                    name="email"
                    type="email"
                    label="Email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={values.email}
                    onChange={(e) => set('email')(e.target.value)}
                    error={errors.email}
                    placeholder="you@example.com"
                  />
                  <Input
                    name="phone"
                    type="tel"
                    label="Phone"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    value={values.phone}
                    onChange={(e) => set('phone')(e.target.value)}
                    error={errors.phone}
                    hint="10 digits, with an optional +91"
                    placeholder="98765 43210"
                  />
                  <Select
                    name="subject"
                    label="What is it about"
                    required
                    value={values.subject}
                    onChange={(e) => set('subject')(e.target.value)}
                    error={errors.subject}
                    options={SUBJECTS.map((s) => ({ value: s.value, label: s.label }))}
                  />
                </div>

                <Textarea
                  name="message"
                  label="Your message"
                  required
                  rows={6}
                  maxLength={MAX_MESSAGE}
                  containerClassName="mt-5"
                  value={values.message}
                  onChange={(e) => set('message')(e.target.value)}
                  error={errors.message}
                  hint={`${values.message.trim().length} / ${MAX_MESSAGE} characters`}
                  placeholder="Order PF-2419 — the spinach arrived warm. Could I get the 2 pm slot on Saturday instead?"
                />

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    variant="ink"
                    size="lg"
                    leftIcon={<Send className="size-4" aria-hidden />}
                  >
                    Check my message
                  </Button>
                  <Button type="button" variant="ghost" onClick={reset}>
                    Clear
                  </Button>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ink-3">
                  No account needed, and nothing is stored on this site.
                </p>
                <p className="sr-only" id={`${formId}-note`}>
                  Submitting checks your details and builds an email message; it does not send
                  anything by itself.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  FAQ                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-rule">
        <div className="shell py-16 md:py-24">
          <SectionHeading
            eyebrow="Before you write"
            title="Four things people ask most"
            lede="If your question is not here, it is exactly the kind of thing the form above is for."
          />

          <dl className="mt-12 border-t border-rule md:mt-16">
            {FAQ.map((item, i) => (
              <div
                key={item.q}
                className={cn(
                  'stagger grid gap-x-10 gap-y-2 border-b border-rule py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]',
                )}
                style={{ '--i': i } as never}
              >
                <dt className="font-display text-xl font-semibold leading-snug text-ink md:text-[1.375rem]">
                  {item.q}
                </dt>
                <dd className="text-[0.9375rem] leading-relaxed text-ink-2">{item.a}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 text-sm leading-relaxed text-ink-3">
            Still stuck?{' '}
            <a href={PHONE_HREF} className="wipe font-medium text-ember">
              Call {PHONE_DISPLAY}
            </a>{' '}
            between 6 am and 2 pm, or come to the yard — someone is always on the crate table.
          </p>
        </div>
      </section>
    </>
  );
}
