export const metadata = { title: 'Условия возврата — Gifmage Store' };

export default function RefundPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-2xl font-bold mb-6">Условия возврата</h1>
      <p className="text-sm text-zinc-400 mb-8">Действует с мая 2026 года</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-base mb-2">Общие условия</h2>
          <p>Услуга по размещению области является цифровой и считается оказанной в момент появления
          области на сетке. Согласно ст. 26.1 Закона «О защите прав потребителей», возврат денежных средств
          за надлежащим образом оказанную цифровую услугу не производится, так как область сразу резервируется
          за вами.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Когда возврат возможен</h2>
          <p>Полный возврат осуществляется, если:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 mt-2">
            <li>произошла техническая ошибка и средства списались повторно;</li>
            <li>выбранная область оказалась занятой из-за сбоя системы;</li>
            <li>оплата прошла, но область так и не появилась на сетке.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Как запросить возврат</h2>
          <p>Напишите на <a href="mailto:waytodev0@gmail.com" className="text-indigo-600 hover:underline">waytodev0@gmail.com</a> с
          деталями заказа в течение 7 дней с момента оплаты. Возврат производится через ЮKassa на ту же карту
          в течение 5–10 рабочих дней.</p>
        </div>
      </section>

      <a href="/" className="inline-block mt-10 text-xs text-zinc-400 hover:text-zinc-600">← На главную</a>
    </main>
  );
}
