import NewsletterPageForm from '../../components/NewsletterPageForm';

export const metadata = {
  title: 'Join The Newsletter',
};

export default function NewsletterPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Join The Newsletter!</h1>
        <p className="text-lg text-gray-700 mb-8">
          Be the first to know about new design releases, promotions, and other news.
        </p>
        
        <NewsletterPageForm />
      </div>
    </main>
  );
}
