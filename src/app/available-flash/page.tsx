import { redirect } from 'next/navigation';

// Permanent redirect from /available-flash to home page
export default function AvailableFlashRedirect() {
  redirect('/'); // Redirect to home page
}
