import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, city, state, comments } = await request.json();

    // Validate email
    const isValidEmail = typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!isValidEmail) {
      console.error('Invalid email format:', email);
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate name
    const isValidName = typeof name === 'string' && name.trim().length > 0;
    if (!isValidName) {
      console.error('Invalid name:', name);
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    console.log('Attempting to send newsletter signup email for:', name, email);

    // Send email notification
    const result = await resend.emails.send({
      from: 'hello@sweetpotatotattoo.com', // Using your verified domain
      to: 'KevinMCauto@gmail.com',
      subject: 'New Newsletter Signup - Sweet Potato Tattoo',
      html: `
        <h2>New Newsletter Signup</h2>
        <p>A new person has signed up for your newsletter!</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${city ? `<p><strong>City:</strong> ${city}</p>` : ''}
        ${state ? `<p><strong>State:</strong> ${state}</p>` : ''}
        ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>This is an automated notification from your Sweet Potato Tattoo website.</em></p>
      `,
      text: `New newsletter signup: ${name} (${email})${city ? ` - City: ${city}` : ''}${state ? `, State: ${state}` : ''}${comments ? ` - Comments: ${comments}` : ''} - Date: ${new Date().toLocaleString()}`,
    });

    console.log('Email sent successfully:', result);
    return NextResponse.json({ ok: true, message: 'Subscription successful' });

  } catch (err: unknown) {
    console.error('Newsletter signup error:', err);
    
    // More specific error handling
    if (err instanceof Error) {
      if (err.message.includes('API key')) {
        return NextResponse.json({ error: 'Email service configuration error' }, { status: 500 });
      }
      if (err.message.includes('domain')) {
        return NextResponse.json({ error: 'Email domain not verified' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 });
  }
}
