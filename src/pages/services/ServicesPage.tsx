import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { fetchTrades, fetchTradeSupply, FALLBACK_TRADES, SERVICES_WA_NUMBER, waLink } from '@/services/servicesService';

const steps = [
  { t: 'Tell us the job', d: 'Pick the trade, describe the work, say when you need someone. It takes about two minutes.' },
  { t: 'We match a verified worker', d: 'We call people we have already checked and confirm availability and rate for you.' },
  { t: 'Work gets done on site', d: 'The worker reaches your unit in Peenya with the agreed scope and rate.' },
  { t: 'You rate the work', d: 'Your feedback decides who we send to the next business.' },
];

const faqs = [
  { q: 'Who are these workers?', a: 'Skilled tradespeople from the Peenya industrial belt: welders, turners, fitters, CNC operators, electricians, panel wiremen and draftsmen. We screen each person before sending them to a customer.' },
  { q: 'Do I have to hire anyone permanently?', a: 'No. Book by the day, by the job, or for a short project. There is no contract, and you pay only for the work you ask for.' },
  { q: 'How is the rate decided?', a: 'The worker states a rate, we confirm it with you before anyone is sent, and the agreed number is recorded. No surprise charges on the day.' },
  { q: 'Which areas do you cover?', a: 'Peenya and nearby industrial areas for now. Ask on WhatsApp if you are close by.' },
  { q: 'I am a worker. How do I get jobs?', a: 'Submit your profile. We verify your trade and contact you on WhatsApp when a matching job comes in.' },
];

const ServicesPage: React.FC = () => {
  const { data: trades = FALLBACK_TRADES } = useQuery({ queryKey: ['service-trades'], queryFn: fetchTrades, staleTime: 600_000 });
  const { data: supply = {} } = useQuery({ queryKey: ['service-supply'], queryFn: fetchTradeSupply, staleTime: 300_000 });
  const wa = waLink(SERVICES_WA_NUMBER, 'Hi SwitchgearShop, I need a skilled worker.\n\nTrade:\nWork:\nLocation:\nWhen:');

  return (
    <div>
      <section className="border-b border-border bg-secondary/30">
        <div className="container-wide py-12 md:py-20 max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            A welder, turner or electrician at your Peenya unit, without hiring one
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Skilled tradespeople on demand for businesses that need a few days of work, not a permanent employee or a contractor.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link to="/services/request">Request a worker</Link></Button>
            <Button size="lg" variant="outline" asChild><a href={wa} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a></Button>
          </div>
        </div>
      </section>

      <section className="container-wide py-12 md:py-16">
        <h2 className="text-2xl font-semibold">What do you need done?</h2>
        <p className="mt-1 text-muted-foreground">Choose a trade to start your request.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trades.filter(t => t.slug !== 'other').map(t => (
            <Link key={t.slug} to={`/services/request?trade=${t.slug}`}
              className="group rounded-lg border border-border p-4 hover:border-primary hover:bg-secondary/40 transition-colors">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium group-hover:text-primary">{t.label}</span>
                {supply[t.slug] > 0 && <span className="text-xs text-muted-foreground">{supply[t.slug]} verified</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="container-wide py-12 md:py-16">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.t}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">{i + 1}</div>
                <h3 className="mt-3 font-medium">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-wide py-12 md:py-16 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Skilled worker looking for jobs?</h2>
          <p className="mt-2 text-muted-foreground">
            Join our verified list. We bring you work from local businesses and you set your own rate.
          </p>
          <Button className="mt-5" size="lg" variant="outline" asChild><Link to="/services/join">Join as a worker</Link></Button>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Common questions</h2>
          <Accordion type="single" collapsible className="mt-2">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
