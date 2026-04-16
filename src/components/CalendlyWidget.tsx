"use client";

import { useEffect, useRef, useState } from 'react';

type CalendlyCalendar = {
  id: string;
  title: string;
  url: string;
};

const DEFAULT_CALENDLY_URL =
  'https://calendly.com/sweetpotatotattoo/tattoo-appointment?hide_event_type_details=1&hide_event_type_selection=1&hide_invitee_details=1&hide_invitee_list_tabs=1&hide_gdpr_banner=1&background_color=ffffff&text_color=414141&primary_color=7b894c';

const DEFAULT_CALENDARS: CalendlyCalendar[] = [
  {
    id: 'april',
    title: 'Click Here to Book in April',
    url: DEFAULT_CALENDLY_URL,
  },
  {
    id: 'may-1-15',
    title: 'Click Here to Book May 1st -May 15th',
    url: DEFAULT_CALENDLY_URL,
  },
  {
    id: 'may-16-31',
    title: 'Click Here to Book May 16th-31st',
    url: DEFAULT_CALENDLY_URL,
  },
  {
    id: 'june',
    title: 'Click Here to Book in June',
    url: DEFAULT_CALENDLY_URL,
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
              <span>{calendar.title}</span>
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