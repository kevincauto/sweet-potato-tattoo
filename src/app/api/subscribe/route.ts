import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email } = await request.json();

  const isValid = typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: 'notify@sweetpotatotattoo.com',
      to: 'KevinMCauto@gmail.com',
      subject: 'New mailing-list signup',
      text: `New subscriber: ${email}`,
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Resend error', err);
    return NextResponse.json({ error: 'Email failed' }, { status: 500 });
  }
} 