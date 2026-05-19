export const metadata = { title: 'Refund Policy — 100K Pixel Grid' };

export default function RefundPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-2xl font-bold mb-6">Refund Policy</h1>
      <p className="text-sm text-zinc-400 mb-8">Last updated: May 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-base mb-2">General Policy</h2>
          <p>All pixel purchases are final and non-refundable. Once a grid area is purchased and your content is live, the transaction cannot be reversed because the space is permanently reserved for you.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Exceptions</h2>
          <p>We will issue a full refund if:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 mt-2">
            <li>A technical error resulted in a duplicate charge for the same area.</li>
            <li>Your selected area was already occupied at the time of purchase due to a system error.</li>
            <li>The payment completed but your area was never displayed on the grid.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">How to Request a Refund</h2>
          <p>Email <a href="mailto:denustininsustinin@gmail.com" className="text-indigo-600 hover:underline">denustininsustinin@gmail.com</a> with your order details within 7 days of purchase. Refunds are processed through Paddle and may take 5–10 business days to appear.</p>
        </div>
      </section>

      <a href="/" className="inline-block mt-10 text-xs text-zinc-400 hover:text-zinc-600">← Back to grid</a>
    </main>
  );
}
