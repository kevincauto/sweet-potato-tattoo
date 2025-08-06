import JotformEmbed from '../../components/JotformEmbed';

export const metadata = {
  title: 'Consent Form',
};

export default function ConsentFormPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <JotformEmbed />
      </div>
    </main>
  );
}
