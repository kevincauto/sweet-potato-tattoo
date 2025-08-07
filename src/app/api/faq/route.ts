import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

// ───────────────────────── GET /api/faq
export async function GET() {
  try {
    let faqData = await kv.get('faq-items');
    
    // If no FAQ data exists, initialize with the original questions
    if (!faqData || (Array.isArray(faqData) && faqData.length === 0)) {
      const originalQuestions: FAQItem[] = [
        {
          id: 'custom-tattoo-requests',
          question: 'Do you do custom tattoo requests?',
          answer: `<span class="font-semibold">Yes</span>, but I don't accept all custom requests. I work within a limited range of styles, and handpoked tattoos have a distinct look to them. Please make sure you like my work/styles before requesting a custom.

<span class="font-semibold">Here is a list of what I will do and what I will not do:</span>

<span class="font-semibold">I like to tattoo:</span>
• Plants, including flowers and vegetables
• Bones and shells
• Nuts and seeds
• Animals of all kinds (except pets, sorry)
• Stars and clouds
• Mythical creatures
• Fire
• Arrows and hands
• Insects/bugs? (I haven't done much of these and I'm not sure yet if I like drawing those. I think it depends on the creature)

<span class="font-semibold">I don't tattoo:</span>
• Man made objects
• Lettering/script
• Geometric designs
• Pets
• People/portraits
• Someone else's art or design
• Food

<span class="font-semibold">Customized Flash:</span>
If you like a flash piece but want to make some design adjustments, that's great, just email me about what you're thinking. If you like a flash piece but want it significantly bigger (like at least 3 inches bigger).

<span class="font-semibold">Booking:</span>
Email me at <a href="mailto:sweetpotatotattoo@gmail.com" class="text-[#7B894C] hover:underline">sweetpotatotattoo@gmail.com</a> with something like "custom tattoo inquiry" as the subject. In your email, please include tattoo reference images, the dimensions you're considering (examples: LxW inches; 3-5in), placement ideas, and your budget. If you are unsure of a few of these things, please provide as much information as you can. Size and budget ranges are also fine, but the tighter.

<span class="font-semibold">Pricing:</span>
Prices depend on size and intricacy of design.
• Smaller than 1"x1" are $100 minimum.
• 1"x1" - 2"x3" start at $120.
• Designs 2"x3" and larger start at $175.

I charge a drawing fee ($30-$100 depending on size/detail) in addition to the $50 deposit. The drawing fee is separate from the cost of the tattoo. When you inquire about a custom, I will give a quote on the drawing fee as well as the tattoo. The drawing fee includes the initial drawing as well as a revised drawing if necessary. Any revisions/re-drawings after the first one will be charged extra depending on the revisions asked for. I don't start working on the design until I receive the drawing fee; it can be sent via Venmo to @Josey-Lee-2.`,
          order: 0
        },
        {
          id: 'touch-ups',
          question: 'How do you handle touch-ups?',
          answer: `Sometimes, for various reasons, ink falls out of a tattoo. It can happen during the healing process or over time, long after the tattoo has healed. If this happens, you can come back to me for a touch-up. During this appointment, I will fill in the places where your tattoo is missing ink.

For scheduling a touch-up, please email me at <a href="mailto:sweetpotatotattoo@gmail.com" class="text-[#7B894C] hover:underline">sweetpotatotattoo@gmail.com</a> with "touch-up" in the subject line. Let me know dates and times that work for you and attach a picture of the tattoo. I will then get back to you to work out a day/time.

It is possible to do a touch-up at the end of a tattoo appointment, but please email me a picture of it prior to the appointment so I can see if we can fit it in.

<span class="font-semibold">Touch-ups are free of charge.</span>

If you need to cancel or reschedule a touch-up, please let me know as soon as possible. Last minute cancellations or reschedulings are not fun, but understandable if you communicate them to me. No shows with zero communication are just unkind, so if you don't show up and don't communicate with me in a timely manner, I may choose not to work with you again.`,
          order: 1
        },
        {
          id: 'location-directions',
          question: 'Where are you located? How do I get there?',
          answer: `<span class="font-bold">Location:</span>
1916 Poplar St, Apt 2N
Philadelphia, PA 19130

<span class="font-bold">Building entry:</span>
Use the Uber St door marked "2N / 2S" and text 267-528-7752 upon arrival.

<span class="font-bold">Parking:</span>
Free street parking nearby—check signs for time limits, be ready for parallel parking, and expect a short walk. Consider garages/lots or transit if parallel parking is a concern.

<span class="font-bold">Public transit:</span>
• 19th & Girard trolley (short walk)
• Broad Street Line – Girard Station (≈ 10 min walk)
• Bus routes 33 & 61 stop nearby`,
          order: 2
        }
      ];
      
      // Save the original questions to the database
      await kv.set('faq-items', originalQuestions);
      faqData = originalQuestions;
    }
    
    return NextResponse.json({ items: faqData || [] });
  } catch (error) {
    console.error('Error fetching FAQ data:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQ data' }, { status: 500 });
  }
}

// ───────────────────────── POST /api/faq
export async function POST(request: Request) {
  try {
    const { question, answer } = await request.json();
    
    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    // Get existing FAQ items to determine the next order
    const existingItems = (await kv.get('faq-items')) as FAQItem[] || [];
    const nextOrder = existingItems.length > 0 ? Math.max(...existingItems.map(item => item.order)) + 1 : 0;
    
    const newItem: FAQItem = {
      id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      question: question.trim(),
      answer: answer.trim(),
      order: nextOrder
    };

    const updatedItems = [...existingItems, newItem];
    await kv.set('faq-items', updatedItems);

    return NextResponse.json({ item: newItem, message: 'FAQ item created successfully' });
  } catch (error) {
    console.error('Error creating FAQ item:', error);
    return NextResponse.json({ error: 'Failed to create FAQ item' }, { status: 500 });
  }
}

// ───────────────────────── PUT /api/faq
export async function PUT(request: Request) {
  try {
    const { id, question, answer } = await request.json();
    
    if (!id || !question || !answer) {
      return NextResponse.json({ error: 'ID, question, and answer are required' }, { status: 400 });
    }

    const existingItems = (await kv.get('faq-items')) as FAQItem[] || [];
    const itemIndex = existingItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'FAQ item not found' }, { status: 404 });
    }

    existingItems[itemIndex] = {
      ...existingItems[itemIndex],
      question: question.trim(),
      answer: answer.trim()
    };

    await kv.set('faq-items', existingItems);

    return NextResponse.json({ item: existingItems[itemIndex], message: 'FAQ item updated successfully' });
  } catch (error) {
    console.error('Error updating FAQ item:', error);
    return NextResponse.json({ error: 'Failed to update FAQ item' }, { status: 500 });
  }
}

// ───────────────────────── DELETE /api/faq
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existingItems = (await kv.get('faq-items')) as FAQItem[] || [];
    const filteredItems = existingItems.filter(item => item.id !== id);
    
    if (filteredItems.length === existingItems.length) {
      return NextResponse.json({ error: 'FAQ item not found' }, { status: 404 });
    }

    await kv.set('faq-items', filteredItems);

    return NextResponse.json({ message: 'FAQ item deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ item:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ item' }, { status: 500 });
  }
}

// ───────────────────────── PATCH /api/faq (for reordering)
export async function PATCH(request: Request) {
  try {
    const { items } = await request.json();
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Update the order of each item
    const updatedItems = items.map((item: FAQItem, index: number) => ({
      ...item,
      order: index
    }));

    await kv.set('faq-items', updatedItems);

    return NextResponse.json({ message: 'FAQ order updated successfully' });
  } catch (error) {
    console.error('Error updating FAQ order:', error);
    return NextResponse.json({ error: 'Failed to update FAQ order' }, { status: 500 });
  }
}
