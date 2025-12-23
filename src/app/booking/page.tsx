import { kv } from '@vercel/kv';
import CalendlyWidget from '../../components/CalendlyWidget';
import BookingRequirements from '../../components/BookingRequirements';

export const metadata = {
  title: 'Booking & Availability',
};

export default async function BookingAvailabilityPage() {
  // Fetch booking page data
  let introText = 'Please read each section fully before booking.';
  try {
    const bookingData = await kv.get<{ introText: string; sections: any[] }>('booking-page');
    if (bookingData?.introText) {
      introText = bookingData.introText;
    }
  } catch (error) {
    console.error('Error fetching booking data:', error);
  }

  return (
    <main className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Booking & Availability</h1>
        
        <p className="text-center text-lg text-gray-700 mb-8 font-bold">
          {introText}
        </p>

        <BookingRequirements />
        
        <CalendlyWidget />
      </div>
    </main>
  );
}
