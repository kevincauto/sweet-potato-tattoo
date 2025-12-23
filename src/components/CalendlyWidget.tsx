"use client";

import { useEffect, useRef, useState } from 'react';

export default function CalendlyWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if Calendly is already available
    if (window.Calendly) {
      setScriptLoaded(true);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    
    if (existingScript) {
      // Wait for script to load
      existingScript.addEventListener('load', () => {
        setScriptLoaded(true);
      });
      // Check if Calendly is already available (script may have loaded)
      if (window.Calendly) {
        setScriptLoaded(true);
      }
      return;
    }

    // Load Calendly script
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

    // Cleanup function
    return () => {
      // Don't remove script on cleanup as it might be used elsewhere
    };
  }, []);

  useEffect(() => {
    if (scriptLoaded && widgetRef.current && window.Calendly) {
      // Clear any existing content
      widgetRef.current.innerHTML = '';
      
      // Initialize the inline widget
      window.Calendly.initInlineWidget({
        url: 'https://calendly.com/sweetpotatotattoo/tattoo-appointment?hide_event_type_details=1&hide_event_type_selection=1&hide_invitee_details=1&hide_invitee_list_tabs=1&hide_gdpr_banner=1&background_color=ffffff&text_color=414141&primary_color=7b894c',
        parentElement: widgetRef.current
      });
    }
  }, [scriptLoaded]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!scriptLoaded && (
        <div className="text-center py-8 text-gray-500">
          <p>Loading booking calendar...</p>
        </div>
      )}
      <div 
        ref={widgetRef}
        style={{ minWidth: '320px', height: '700px' }}
      />
    </div>
  );
} 