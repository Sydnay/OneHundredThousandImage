export const metadata = { title: 'Privacy Policy — Million Dollar Grid' };

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-zinc-400 mb-8">Last updated: May 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-base mb-2">1. Information We Collect</h2>
          <p>We do not collect personal information directly. When you make a purchase, payment data (name, email, billing address) is collected and processed by Paddle, our payment processor. We receive only the pixel purchase details (grid coordinates, color, image URL) necessary to render your area.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">2. Images and Content</h2>
          <p>Images uploaded to the grid are stored via Cloudinary and served publicly. Do not upload images containing personal data you wish to keep private.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">3. Cookies</h2>
          <p>We do not use tracking cookies. Paddle may set cookies during the checkout flow as part of their payment processing service.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">4. Third-Party Services</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600">
            <li><strong>Paddle</strong> — payment processing (paddle.com/privacy)</li>
            <li><strong>Cloudinary</strong> — image hosting (cloudinary.com/privacy)</li>
            <li><strong>Neon</strong> — database hosting (neon.tech/privacy)</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">5. Data Retention</h2>
          <p>Purchase records (coordinates and content) are retained indefinitely to display your pixel area. To request removal, contact us.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">6. Contact</h2>
          <p>Privacy questions: <a href="mailto:ytsmartmuesli@gmail.com" className="text-indigo-600 hover:underline">ytsmartmuesli@gmail.com</a>.</p>
        </div>
      </section>

      <a href="/" className="inline-block mt-10 text-xs text-zinc-400 hover:text-zinc-600">← Back to grid</a>
    </main>
  );
}
