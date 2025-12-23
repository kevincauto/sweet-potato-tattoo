import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface BookingSection {
  id: string;
  title: string;
  content: string; // HTML content as string
  order: number;
}

interface BookingPageData {
  introText: string;
  sections: BookingSection[];
}

// ───────────────────────── GET /api/booking
export async function GET() {
  try {
    let bookingData = await kv.get<BookingPageData>('booking-page');
    
    // If no booking data exists, initialize with default content
    if (!bookingData) {
      const defaultData: BookingPageData = {
        introText: 'Please read each section fully before booking.',
        sections: [
          {
            id: 'important-notes',
            title: 'Important Notes',
            content: `<div class="space-y-4">
  <div>
    <p class="font-bold">Age & Photo ID:</p>
    <p>New clients must be 18+ and bring a valid photo ID to the first appointment.</p>
  </div>
  <div>
    <p class="font-bold">Health:</p>
    <p>If you have taken antibiotics within 10 days of the session or are feeling unwell, please reschedule.</p>
  </div>
  <div>
    <p class="font-bold">Deposit:</p>
    <p>A $50 non-refundable deposit is required when booking and is applied to the final tattoo cost.</p>
  </div>
  <div>
    <p class="font-bold">Accessibility:</p>
    <p>The studio is up three flights of stairs and is not wheelchair-accessible.</p>
  </div>
</div>`,
            order: 0
          },
          {
            id: 'lateness',
            title: 'Lateness & Rescheduling',
            content: `<div class="space-y-4">
  <div>
    <p class="font-bold">Arrival window:</p>
    <p>Aim to arrive 5–10 minutes early. Up to 20 minutes of grace time is allowed; text 267-528-7752 if you're delayed.</p>
  </div>
  <div>
    <p class="font-bold">Late arrival (&gt; 20 min):</p>
    <p>Appointment may be cancelled or a late fee may apply, depending on the day's schedule.</p>
  </div>
  <div>
    <p class="font-bold">Reschedule ≥ 48 hrs ahead:</p>
    <p>Original deposit carries over.</p>
  </div>
  <div>
    <p class="font-bold">Reschedule &lt; 48 hrs or second reschedule:</p>
    <p>Treated as a cancellation; a new deposit is required.</p>
  </div>
  <div>
    <p class="font-bold">Cancellations by artist:</p>
    <p>Deposit may be refunded or carried over; you'll be notified at least 24 hrs in advance when possible.</p>
  </div>
  <div>
    <p class="font-bold">No-shows:</p>
    <ul class="list-disc pl-6 space-y-1">
      <li>New clients will not be re-booked.</li>
      <li>Returning clients must explain promptly or future bookings may be refused.</li>
    </ul>
  </div>
</div>`,
            order: 1
          },
          {
            id: 'preparation',
            title: 'Preparing for Your Appointment',
            content: `<div class="space-y-4">
  <div>
    <p class="font-bold">Technique & Timing:</p>
    <p>Hand-poked tattoos only (no machine); most sessions run 1–3 hours, so plan accordingly.</p>
  </div>
  <div>
    <p class="font-bold">Before your appointment:</p>
    <ul class="list-disc pl-6 space-y-1">
      <li>Eat & hydrate beforehand.</li>
      <li>Wear loose, comfortable clothing you don't mind getting inky; slip-on shoes make it easier (shoes come off inside).</li>
      <li>Shave the tattoo area in advance if possible to reduce single-use razor waste (optional).</li>
    </ul>
  </div>
  <div>
    <p class="font-bold">Bring:</p>
    <ul class="list-disc pl-6 space-y-1">
      <li>Photo ID (new clients)</li>
      <li>Mask (if you opted for a masks-on session)</li>
      <li>Water/snacks for breaks</li>
      <li>Music + headphones or a book if you prefer quiet time</li>
    </ul>
  </div>
</div>`,
            order: 2
          },
          {
            id: 'payment',
            title: 'Payment & Tips',
            content: `<div class="space-y-4">
  <div>
    <p class="font-bold">Payments accepted:</p>
    <p>Venmo (preferred), Zelle, or cash.</p>
  </div>
  <div>
    <p class="font-bold">Tips:</p>
    <p>Appreciated but never expected; accepted via cash or Venmo.</p>
  </div>
</div>`,
            order: 3
          }
        ]
      };
      
      // Save the default data to the database
      await kv.set('booking-page', defaultData);
      bookingData = defaultData;
    }
    
    return NextResponse.json(bookingData);
  } catch (error) {
    console.error('Error fetching booking data:', error);
    return NextResponse.json({ error: 'Failed to fetch booking data' }, { status: 500 });
  }
}

// ───────────────────────── PUT /api/booking
export async function PUT(request: Request) {
  try {
    const { introText, sections } = await request.json();
    
    if (typeof introText !== 'string') {
      return NextResponse.json({ error: 'Intro text is required' }, { status: 400 });
    }

    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: 'Sections array is required' }, { status: 400 });
    }

    const bookingData: BookingPageData = {
      introText: introText.trim(),
      sections: sections.map((section: BookingSection, index: number) => ({
        id: section.id,
        title: section.title.trim(),
        content: section.content.trim(),
        order: index
      }))
    };

    await kv.set('booking-page', bookingData);

    return NextResponse.json({ message: 'Booking page updated successfully', data: bookingData });
  } catch (error) {
    console.error('Error updating booking page:', error);
    return NextResponse.json({ error: 'Failed to update booking page' }, { status: 500 });
  }
}

// ───────────────────────── POST /api/booking (add new section)
export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const existingData = (await kv.get<BookingPageData>('booking-page')) || {
      introText: '',
      sections: []
    };

    const newSection: BookingSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: title.trim(),
      content: content.trim(),
      order: existingData.sections.length
    };

    const updatedSections = [...existingData.sections, newSection];
    const bookingData: BookingPageData = {
      ...existingData,
      sections: updatedSections
    };

    await kv.set('booking-page', bookingData);

    return NextResponse.json({ message: 'Section added successfully', section: newSection });
  } catch (error) {
    console.error('Error adding section:', error);
    return NextResponse.json({ error: 'Failed to add section' }, { status: 500 });
  }
}

// ───────────────────────── DELETE /api/booking
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const existingData = (await kv.get<BookingPageData>('booking-page')) || {
      introText: '',
      sections: []
    };

    const filteredSections = existingData.sections.filter(section => section.id !== id);
    
    if (filteredSections.length === existingData.sections.length) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const bookingData: BookingPageData = {
      ...existingData,
      sections: filteredSections.map((section, index) => ({
        ...section,
        order: index
      }))
    };

    await kv.set('booking-page', bookingData);

    return NextResponse.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
  }
}

// ───────────────────────── PATCH /api/booking (for reordering)
export async function PATCH(request: Request) {
  try {
    const { sections } = await request.json();
    
    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: 'Sections array is required' }, { status: 400 });
    }

    const existingData = (await kv.get<BookingPageData>('booking-page')) || {
      introText: '',
      sections: []
    };

    // Update the order of each section
    const updatedSections = sections.map((section: BookingSection, index: number) => ({
      ...section,
      order: index
    }));

    const bookingData: BookingPageData = {
      ...existingData,
      sections: updatedSections
    };

    await kv.set('booking-page', bookingData);

    return NextResponse.json({ message: 'Booking order updated successfully' });
  } catch (error) {
    console.error('Error updating booking order:', error);
    return NextResponse.json({ error: 'Failed to update booking order' }, { status: 500 });
  }
}

