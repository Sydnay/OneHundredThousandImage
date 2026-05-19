export const metadata = { title: 'Terms of Service — Million Dollar Grid' };

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-zinc-400 mb-8">Last updated: May 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-base mb-2">1. Service Description</h2>
          <p>Million Dollar Grid allows users to purchase rectangular areas on a 1000×1000 pixel grid. Each cell costs $1 USD. Purchased areas may display a solid color or an uploaded image and remain on the grid permanently.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">2. Purchases</h2>
          <p>All purchases are final. Once a cell area is purchased, it is assigned to the buyer and cannot be transferred or refunded except as described in the Refund Policy. Overlapping areas are not permitted; the system enforces this automatically.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">3. Content Guidelines</h2>
          <p>Users may not upload images or display content that is illegal, obscene, defamatory, or infringes third-party intellectual property rights. We reserve the right to remove content that violates these guidelines without refund.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">4. Payment Processing</h2>
          <p>Payments are processed by Paddle.com Market Limited ("Paddle"), which acts as Merchant of Record. By completing a purchase you also agree to Paddle's terms of service.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">5. Availability</h2>
          <p>We aim to keep purchased content visible indefinitely, but do not guarantee uninterrupted availability. We are not liable for temporary outages.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">6. Changes</h2>
          <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">7. Contact</h2>
          <p>Questions? Email us at <a href="mailto:ytsmartmuesli@gmail.com" className="text-indigo-600 hover:underline">ytsmartmuesli@gmail.com</a>.</p>
        </div>
      </section>

      <a href="/" className="inline-block mt-10 text-xs text-zinc-400 hover:text-zinc-600">← Back to grid</a>
    </main>
  );
}
