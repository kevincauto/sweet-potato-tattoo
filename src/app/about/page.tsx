import { kv } from '@vercel/kv';

export const metadata = {
  title: 'About',
};

export default async function AboutPage() {
  // Fetch about page data
  let title = 'About';
  let content = '<p>Content coming soon.</p>';
  
  try {
    const aboutData = await kv.get<{ title: string; content: string }>('about-page');
    if (aboutData) {
      title = aboutData.title || 'About';
      content = aboutData.content || '<p>Content coming soon.</p>';
    }
  } catch (error) {
    console.error('Error fetching about data:', error);
  }

  return (
    <main className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light text-center my-8 text-[#414141]">{title}</h1>
        
        <div 
          className="prose max-w-none text-[#414141] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </main>
  );
}

