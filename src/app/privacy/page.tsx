export const metadata = { title: 'Политика конфиденциальности — Gifmage Store' };

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-2xl font-bold mb-6">Политика конфиденциальности</h1>
      <p className="text-sm text-zinc-400 mb-8">Действует с мая 2026 года · в соответствии с 152-ФЗ</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-base mb-2">1. Оператор персональных данных</h2>
          <p>Оператором персональных данных является самозанятый (плательщик НПД), <strong>ИНН 631819270208</strong>.
          Настоящая Политика описывает порядок обработки персональных данных в соответствии с
          Федеральным законом № 152-ФЗ «О персональных данных».</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">2. Какие данные мы собираем</h2>
          <p>При оформлении заказа мы получаем ваш адрес электронной почты — он необходим для
          направления чека самозанятого (НПД) через сервис «Мой налог». Данные банковской карты
          обрабатываются платёжным сервисом ЮKassa и нам не передаются.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">3. Цели обработки</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600">
            <li>оказание оплаченной услуги;</li>
            <li>формирование и направление чека самозанятого через «Мой налог» (требование 422-ФЗ);</li>
            <li>обратная связь по запросу пользователя.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">4. Согласие на обработку</h2>
          <p>Оформляя заказ, вы даёте согласие на обработку персональных данных в указанных целях.
          Согласие можно отозвать, направив запрос на email ниже.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">5. Передача третьим лицам</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600">
            <li><strong>ЮKassa (АО «ЮMoney»)</strong> — обработка платежей;</li>
            <li><strong>ФНС «Мой налог»</strong> — формирование чека самозанятого (НПД);</li>
            <li><strong>Cloudinary</strong> — хранение загруженных изображений;</li>
            <li><strong>Neon</strong> — хранение данных о размещённых областях.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">6. Загруженные изображения</h2>
          <p>Изображения, размещённые на сетке, отображаются публично. Не загружайте изображения,
          содержащие персональные данные, которые вы хотите сохранить в тайне.</p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">7. Контакты</h2>
          <p>По вопросам обработки персональных данных:
          <a href="mailto:ytsmartmuesli@gmail.com" className="text-indigo-600 hover:underline"> ytsmartmuesli@gmail.com</a></p>
        </div>
      </section>

      <a href="/" className="inline-block mt-10 text-xs text-zinc-400 hover:text-zinc-600">← На главную</a>
    </main>
  );
}
