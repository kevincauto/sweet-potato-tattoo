import CalendlyWidget from '../../components/CalendlyWidget';
import BookingRequirements from '../../components/BookingRequirements';

export const metadata = {
  title: 'Booking & Availability',
};

export default function BookingAvailabilityPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Booking & Availability</h1>
        
        <p className="text-center text-lg text-gray-700 mb-8 font-bold">
          Please read each section fully before booking.
        </p>

        <BookingRequirements />
        
        <CalendlyWidget />
      </div>
    </main>
  );
}
