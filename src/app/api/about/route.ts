import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface AboutPageData {
  title: string;
  content: string; // HTML content as string
}

// ───────────────────────── GET /api/about
export async function GET() {
  try {
    let aboutData = await kv.get<AboutPageData>('about-page');
    
    // If no about data exists, initialize with default content
    if (!aboutData) {
      const defaultData: AboutPageData = {
        title: 'About',
        content: `<div class="space-y-6">
  <div>
    <p class="text-lg leading-relaxed">
      Welcome to Sweet Potato Tattoo, a handpoked tattoo studio in Philadelphia, PA.
    </p>
  </div>
  <div>
    <h2 class="text-2xl font-semibold mb-3">About the Artist</h2>
    <p class="leading-relaxed">
      I'm Josey, and I specialize in handpoked tattoos. Each piece is created with care and attention to detail, using traditional handpoke techniques rather than machines.
    </p>
  </div>
  <div>
    <h2 class="text-2xl font-semibold mb-3">My Style</h2>
    <p class="leading-relaxed">
      I work within a limited range of styles, focusing on nature-inspired designs including plants, animals, bones, shells, and natural elements. Handpoked tattoos have a distinct look and feel that I love to create.
    </p>
  </div>
  <div>
    <h2 class="text-2xl font-semibold mb-3">The Studio</h2>
    <p class="leading-relaxed">
      Located in Philadelphia, my studio is a welcoming space where we can work together to create something beautiful. The studio is up three flights of stairs, so please keep accessibility in mind when booking.
    </p>
  </div>
  <div>
    <h2 class="text-2xl font-semibold mb-3">Get in Touch</h2>
    <p class="leading-relaxed">
      Have questions or want to book an appointment? Check out the <a href="/booking" class="text-[#7B894C] hover:underline">Booking & Availability</a> page or email me at <a href="mailto:sweetpotatotattoo@gmail.com" class="text-[#7B894C] hover:underline">sweetpotatotattoo@gmail.com</a>.
    </p>
  </div>
</div>`
      };
      
      // Save the default data to the database
      await kv.set('about-page', defaultData);
      aboutData = defaultData;
    }
    
    return NextResponse.json(aboutData);
  } catch (error) {
    console.error('Error fetching about data:', error);
    return NextResponse.json({ error: 'Failed to fetch about data' }, { status: 500 });
  }
}

// ───────────────────────── PUT /api/about
export async function PUT(request: Request) {
  try {
    const { title, content } = await request.json();
    
    if (typeof title !== 'string' || typeof content !== 'string') {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const aboutData: AboutPageData = {
      title: title.trim(),
      content: content.trim()
    };

    await kv.set('about-page', aboutData);

    return NextResponse.json({ message: 'About page updated successfully', data: aboutData });
  } catch (error) {
    console.error('Error updating about page:', error);
    return NextResponse.json({ error: 'Failed to update about page' }, { status: 500 });
  }
}

