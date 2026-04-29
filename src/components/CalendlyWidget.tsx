"use client";

import { useEffect, useRef, useState } from 'react';

type CalendlyCalendar = {
  id: string;
  title: string;
  location?: string;
  url: string;
};

const DEFAULT_CALENDARS: CalendlyCalendar[] = [
  {
    id: 'may-1-13',
    title: 'Click Here to Book May 1st - May 13th',
    location: 'Tattoo Mahal (Philadelphia, PA)',
    url: 'https://calendly.com/sweetpotatotattoo/tattoo-mahal-pt-i',
  },
  {
    id: 'may-14-16',
    title: 'Click Here to Book May 14th - May 16th',
    location: 'Dekaying Tattoos (Morton, PA)',
    url: 'https://calendly.com/sweetpotatotattoo/dekaying-tattoo-pt-i',
  },
  {
    id: 'may-25-29',
    title: 'Click Here to Book May 25th - May 29th',
    location: 'Dekaying Tattoos (Morton, PA)',
    url: 'https://calendly.com/sweetpotatotattoo/dekaying-tattoo-pt-i-clone',
  },
  {
    id: 'may-30-june-19',
    title: 'Click Here to Book May 30th - June 19th',
    location: 'Tattoo Mahal (Philadelphia, PA)',
    url: 'https://calendly.com/sweetpotatotattoo/tattoo-mahal-pt-i-clone',
  },
];

function CalendlyInlineEmbed({
  url,
  scriptLoaded,
  isOpen,
}: {
  url: string;
  scriptLoaded: boolean;
  isOpen: boolean;
}) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !scriptLoaded || !widgetRef.current || !window.Calendly) {
      return;
    }

    widgetRef.current.innerHTML = '';

    window.Calendly.initInlineWidget({
      url,
      parentElement: widgetRef.current,
    });

    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, [isOpen, scriptLoaded, url]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="rounded-b-xl border border-t-0 border-[#7b894c] bg-white p-4 md:p-6">
      {!scriptLoaded && (
        <div className="py-8 text-center text-gray-500">
          <p>Loading booking calendar...</p>
        </div>
      )}
      <div ref={widgetRef} style={{ minWidth: '320px', height: '700px' }} />
    </div>
  );
}

export default function CalendlyWidget({
  calendars = DEFAULT_CALENDARS,
}: {
  calendars?: CalendlyCalendar[];
}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);

  useEffect(() => {
    if (window.Calendly) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://assets.calendly.com/assets/external/widget.js"]'
    );

    if (existingScript) {
      const handleLoad = () => {
        setScriptLoaded(true);
      };

      existingScript.addEventListener('load', handleLoad);

      if (window.Calendly) {
        setScriptLoaded(true);
      }

      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Calendly script');
    };

    document.head.appendChild(script);
  }, []);

  return (
    <div className="mx-auto mb-24 w-full max-w-4xl space-y-4">
      {calendars.map((calendar) => {
        const isOpen = openCalendarId === calendar.id;

        return (
          <section key={calendar.id} className="w-full">
            <button
              type="button"
              onClick={() =>
                setOpenCalendarId((current) =>
                  current === calendar.id ? null : calendar.id
                )
              }
              aria-expanded={isOpen}
              className={`flex w-full items-center justify-between bg-[#7b894c] px-6 py-5 text-left text-lg font-semibold text-white transition hover:bg-[#6f7d44] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7b894c] focus-visible:ring-offset-2 ${
                isOpen ? 'rounded-t-xl' : 'rounded-xl'
              }`}
            >
              <span>
                <span className="block">{calendar.title}</span>
                {calendar.location && (
                  <span className="mt-1 block text-base font-normal text-white/90">
                    {calendar.location}
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={`text-2xl leading-none transition-transform ${
                  isOpen ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>

            <CalendlyInlineEmbed
              url={calendar.url}
              scriptLoaded={scriptLoaded}
              isOpen={isOpen}
            />
          </section>
        );
      })}
    </div>
  );
}

export type { CalendlyCalendar };