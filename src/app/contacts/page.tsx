export const metadata = { title: 'Реквизиты и контакты — Million Dollar Grid' };

export default function ContactsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-2xl font-bold mb-6">Реквизиты и контакты</h1>

      <section className="space-y-4 text-sm leading-relaxed">
        <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-5 py-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">Статус</span>
            <span className="text-zinc-800 font-medium">Самозанятый (плательщик НПД)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">ИНН</span>
            <span className="text-zinc-800 font-medium">631819270208</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Email</span>
            <a href="mailto:ytsmartmuesli@gmail.com" className="text-indigo-600 hover:underline font-medium">ytsmartmuesli@gmail.com</a>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Сайт</span>
            <span className="text-zinc-800 font-medium">themilliondollargrid</span>
          </div>
        </div>

        <p className="text-zinc-600">
          Million Dollar Grid — цифровой сервис размещения изображений и цветов на сетке 1000×1000.
          Стоимость услуги — 10 ₽ за клетку. Подробные условия описаны в{' '}
          <a href="/terms" className="text-indigo-600 hover:underline">публичной оферте</a>.
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 pt-2">
          <a href="/terms" className="hover:text-zinc-600">Публичная оферта</a>
          <a href="/privacy" className="hover:text-zinc-600">Политика конфиденциальности</a>
          <a href="/refund" className="hover:text-zinc-600">Условия возврата</a>
        </div>
      </section>

      <a href="/" className="inline-block mt-10 text-xs text-zinc-400 hover:text-zinc-600">← На главную</a>
    </main>
  );
}
