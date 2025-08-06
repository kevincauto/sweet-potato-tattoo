"use client";

import { useEffect } from 'react';

export default function CalendlyWidget() {
  useEffect(() => {
    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        className="calendly-inline-widget" 
        data-url="https://calendly.com/sweetpotatotattoo/tattoo-appointment?hide_event_type_details=1&hide_event_type_selection=1&hide_invitee_details=1&hide_invitee_list_tabs=1&hide_inline_widget_iframe=1&hide_gdpr_banner=1&background_color=ffffff&text_color=414141&primary_color=7b894c" 
        style={{ minWidth: '320px', height: '700px' }}
      />
    </div>
  );
} 