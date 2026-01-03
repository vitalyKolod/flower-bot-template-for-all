import { Markup } from 'telegraf'

export function renderStart() {
  return {
    text: 'Здравствуйте! \nЭто цветочный магазин labybird г.Майкоп, ул.Депутатская 12.\nПомогу оформить заказ 💐',
    keyboard: Markup.inlineKeyboard([[Markup.button.callback('🌸 Заказать букет', 'E1')]]),
  }
}

export function renderE1() {
  return {
    text: 'Какой букет вы хотите?',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('✅ Готовый букет', 'E2_READY')],
      [Markup.button.callback('✨ Индивидуальный букет', 'E2_CUSTOM')],
    ]),
  }
}

export function renderBudget() {
  return {
    text: 'На какой бюджет вы ориентируетесь?',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('💐 до 3000', 'BUDGET_3000')],
      [Markup.button.callback('🌸 3000–5000', 'BUDGET_3000_5000')],
      [Markup.button.callback('🌹 5000–7000', 'BUDGET_5000_7000')],
      [Markup.button.callback('🌺 7000+', 'BUDGET_7000')],
      [Markup.button.callback('✍️ Напишу сам', 'BUDGET_MANUAL')],
      [Markup.button.callback('⬅️ Назад', 'BACK')],
    ]),
  }
}

export function renderReady() {
  return {
    text: 'Пришлите фото букета или напишите название/описание 🌸',
    keyboard: Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад', 'BACK')]]),
  }
}

export function renderStyle() {
  return {
    text: 'Есть пожелания по цветам или стилю?',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('Без разницы', 'STYLE_ANY')],
      [Markup.button.callback('Нежный / светлый', 'STYLE_SOFT')],
      [Markup.button.callback('Яркий', 'STYLE_BRIGHT')],
      [Markup.button.callback('✍️ Напишу сам', 'STYLE_MANUAL')],
      [Markup.button.callback('⬅️ Назад', 'BACK')],
    ]),
  }
}

export function renderDelivery() {
  return {
    text: 'Как вам удобнее получить букет?',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('🚚 Доставка', 'DELIVERY_COURIER')],
      [Markup.button.callback('🏠 Самовывоз', 'DELIVERY_PICKUP')],
      [Markup.button.callback('⬅️ Назад', 'BACK')],
    ]),
  }
}

export function renderAddress() {
  return {
    text: 'Напишите адрес доставки 📍 (город/улица/дом)',
    keyboard: Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад', 'BACK')]]),
  }
}

export function renderContact() {
  return {
    text: 'Оставьте номер телефона, чтобы мы подтвердили заказ 📞',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('📱 Отправить номер', 'CONTACT_REQUEST')],
      [Markup.button.callback('✍️ Ввести вручную', 'CONTACT_MANUAL')],
      [Markup.button.callback('⬅️ Назад', 'BACK')],
    ]),
  }
}

export function renderConfirm(text: string) {
  return {
    text,
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('✅ Отправить заявку', 'CONFIRM_SEND')],
      [Markup.button.callback('⬅️ Назад', 'BACK')],
    ]),
  }
}

export function renderDone() {
  return {
    text: 'Заявка отправлена! 🎉\n\nМенеджер скоро свяжется с вами 😊',
    keyboard: Markup.inlineKeyboard([[Markup.button.callback('🌸 Новый заказ', 'E1')]]),
  }
}

export function renderAdminHome() {
  return {
    text: '👨‍💼 Админ-панель',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('📦 Заказы', 'ADMIN_ORDERS')],
      [Markup.button.callback('👥 Менеджеры', 'ADMIN_MANAGERS')],
      [Markup.button.callback('📢 Рассылка', 'ADMIN_BROADCAST')],
      [Markup.button.callback('📊 Статистика', 'ADMIN_STATS')],
      [Markup.button.callback('⬅️ Выйти', 'ADMIN_EXIT')],
    ]),
  }
}

export function renderAdminOrdersStub() {
  return {
    text: '📦 Заказы\n' + 'Страница 1 / 1\n\n' + '🚧 Пока заглушка. Дальше подключим базу.',
    keyboard: Markup.inlineKeyboard([
      [
        Markup.button.callback('⬅️', 'ADMIN_ORDERS_PREV'),
        Markup.button.callback('➡️', 'ADMIN_ORDERS_NEXT'),
      ],
      [Markup.button.callback('🧹 Фильтр', 'ADMIN_FILTER')],
      [Markup.button.callback('⬅️ Назад', 'ADMIN_HOME')],
    ]),
  }
}
