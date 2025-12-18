// import 'dotenv/config'
// import { Telegraf } from 'telegraf'
// import mongoose from 'mongoose'

// import { getOrCreateUser, setState, goBack } from './fsm'
// import { Order, getActiveOrder } from './models/Order'
// import {
//   renderStart,
//   renderE1,
//   renderReady,
//   renderBudget,
//   renderStyle,
//   renderDelivery,
//   renderAddress,
//   renderContact,
//   renderConfirm,
//   renderDone,
// } from './screens'

// const bot = new Telegraf(process.env.BOT_TOKEN!)

// async function start() {
//   await mongoose.connect(process.env.MONGO_URI!)
//   console.log('Mongo connected')

//   /* ================= /start ================= */
//   bot.start(async (ctx) => {
//     await getOrCreateUser(ctx.from.id, ctx.from.username)
//     await setState(ctx.from.id, 'START')

//     const s = renderStart()
//     await ctx.reply(s.text, s.keyboard)
//   })

//   /* ================= E1 ================= */
//   bot.action('E1', async (ctx) => {
//     await setState(ctx.from!.id, 'E1_CHOOSE_TYPE', 'START')
//     const s = renderE1()
//     await ctx.editMessageText(s.text, s.keyboard)
//   })

//   /* ================= READY ================= */
//   bot.action('E2_READY', async (ctx) => {
//     const tgId = ctx.from!.id

//     await setState(tgId, 'E2_READY', 'E1_CHOOSE_TYPE')

//     await Order.create({
//       userTgId: tgId,
//       type: 'READY',
//       deliveryType: 'COURIER',
//       phone: 'temp',
//     })

//     const s = renderReady()
//     await ctx.editMessageText(s.text, s.keyboard)
//   })

//   /* ================= CUSTOM → BUDGET ================= */
//   bot.action('E2_CUSTOM', async (ctx) => {
//     const tgId = ctx.from!.id

//     await setState(tgId, 'E2_CUSTOM', 'E1_CHOOSE_TYPE')

//     await Order.create({
//       userTgId: tgId,
//       type: 'CUSTOM',
//       deliveryType: 'COURIER',
//       phone: 'temp',
//     })

//     const s = renderBudget()
//     await ctx.editMessageText(s.text, s.keyboard)
//   })

//   /* ================= BACK ================= */
//   bot.action('BACK', async (ctx) => {
//     const prev = await goBack(ctx.from!.id)
//     if (!prev) return

//     if (prev === 'E1_CHOOSE_TYPE') {
//       const s = renderE1()
//       return ctx.editMessageText(s.text, s.keyboard)
//     }

//     if (prev === 'E2_CUSTOM') {
//       const s = renderBudget()
//       return ctx.editMessageText(s.text, s.keyboard)
//     }

//     if (prev === 'E3_DELIVERY' || prev === 'WAIT_ADDRESS' || prev === 'WAIT_PHONE_TEXT') {
//       const s = renderDelivery()
//       return ctx.editMessageText(s.text, s.keyboard)
//     }

//     if (prev === 'CONFIRM') {
//       const s = renderContact()
//       return ctx.editMessageText(s.text, s.keyboard)
//     }
//   })

//   /* ================= БЮДЖЕТ ================= */
//   const BUDGET_MAP: Record<string, string> = {
//     BUDGET_3000: 'до 3000',
//     BUDGET_3000_5000: '3000–5000',
//     BUDGET_5000_7000: '5000–7000',
//     BUDGET_7000: '7000+',
//   }

//   Object.keys(BUDGET_MAP).forEach((action) => {
//     bot.action(action, async (ctx) => {
//       const tgId = ctx.from!.id
//       await ctx.answerCbQuery()

//       const order = await getActiveOrder(tgId)
//       if (order) {
//         order.budget = BUDGET_MAP[action]
//         await order.save()
//       }

//       await setState(tgId, 'E2_CUSTOM', 'E2_CUSTOM')
//       const s = renderStyle()
//       await ctx.editMessageText(s.text, s.keyboard)
//     })
//   })

//   bot.action('BUDGET_MANUAL', async (ctx) => {
//     await ctx.answerCbQuery()
//     await setState(ctx.from!.id, 'WAIT_BUDGET_TEXT', 'E2_CUSTOM')
//     await ctx.editMessageText('Напишите бюджет в свободной форме 💬')
//   })

//   /* ================= СТИЛЬ ================= */
//   const STYLE_MAP = {
//     STYLE_ANY: 'Без разницы',
//     STYLE_SOFT: 'Нежный / светлый',
//     STYLE_BRIGHT: 'Яркий',
//   }

//   Object.keys(STYLE_MAP).forEach((action) => {
//     bot.action(action, async (ctx) => {
//       await ctx.answerCbQuery()
//       await setState(ctx.from!.id, 'E3_DELIVERY', 'E2_CUSTOM')
//       const s = renderDelivery()
//       await ctx.editMessageText(s.text, s.keyboard)
//     })
//   })

//   bot.action('STYLE_MANUAL', async (ctx) => {
//     await ctx.answerCbQuery()
//     await setState(ctx.from!.id, 'WAIT_STYLE_TEXT', 'E2_CUSTOM')
//     await ctx.editMessageText('Опишите желаемый стиль 💬')
//   })

//   /* ================= ДОСТАВКА ================= */
//   bot.action('DELIVERY_COURIER', async (ctx) => {
//     await ctx.answerCbQuery()
//     await setState(ctx.from!.id, 'WAIT_ADDRESS', 'E3_DELIVERY')
//     const s = renderAddress()
//     await ctx.editMessageText(s.text, s.keyboard)
//   })

//   bot.action('DELIVERY_PICKUP', async (ctx) => {
//     await ctx.answerCbQuery()
//     await setState(ctx.from!.id, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')
//     const s = renderContact()
//     await ctx.editMessageText(s.text, s.keyboard)
//   })

//   /* ================= CONTACT ================= */
//   bot.on('contact', async (ctx) => {
//     const phone = ctx.message.contact.phone_number
//     const tgId = ctx.from.id

//     const user = await getOrCreateUser(tgId)
//     if (user.state !== 'WAIT_PHONE_TEXT') return

//     const order = await getActiveOrder(tgId)
//     if (order) {
//       order.phone = phone
//       await order.save()
//     }

//     await setState(tgId, 'CONFIRM')

//     const text =
//       'Проверьте заказ 👇\n\n' +
//       `Тип: ${order?.type}\n` +
//       `Бюджет: ${order?.budget ?? '—'}\n` +
//       `Стиль: ${order?.style ?? '—'}\n` +
//       `Получение: ${order?.deliveryType}\n` +
//       `Адрес: ${order?.address ?? '—'}\n` +
//       `Телефон: ${phone}`

//     const s = renderConfirm(text)
//     await ctx.reply(s.text, s.keyboard)
//   })

//   /* ================= TEXT FSM ================= */
//   bot.on('text', async (ctx) => {
//     const tgId = ctx.from.id
//     const user = await getOrCreateUser(tgId)
//     const text = ctx.message.text

//     if (user.state === 'WAIT_ADDRESS') {
//       const order = await getActiveOrder(tgId)
//       if (order) {
//         order.address = text
//         await order.save()
//       }

//       await setState(tgId, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')
//       await ctx.reply(`Адрес принят 📍\n${text}`)
//       const s = renderContact()
//       return ctx.reply(s.text, s.keyboard)
//     }

//     if (user.state === 'WAIT_PHONE_TEXT') {
//       const order = await getActiveOrder(tgId)
//       if (order) {
//         order.phone = text
//         await order.save()
//       }

//       await setState(tgId, 'CONFIRM')

//       const summary =
//         'Проверьте заказ 👇\n\n' +
//         `Тип: ${order?.type}\n` +
//         `Бюджет: ${order?.budget ?? '—'}\n` +
//         `Стиль: ${order?.style ?? '—'}\n` +
//         `Получение: ${order?.deliveryType}\n` +
//         `Адрес: ${order?.address ?? '—'}\n` +
//         `Телефон: ${text}`

//       const s = renderConfirm(summary)
//       return ctx.reply(s.text, s.keyboard)
//     }

//     if (user.state === 'WAIT_STYLE_TEXT') {
//       const order = await getActiveOrder(tgId)
//       if (order) {
//         order.style = text
//         await order.save()
//       }

//       await setState(tgId, 'E3_DELIVERY')
//       const s = renderDelivery()
//       return ctx.reply(s.text, s.keyboard)
//     }

//     if (user.state === 'WAIT_BUDGET_TEXT') {
//       const order = await getActiveOrder(tgId)
//       if (order) {
//         order.budget = text
//         await order.save()
//       }

//       await setState(tgId, 'E2_CUSTOM')
//       const s = renderStyle()
//       return ctx.reply(s.text, s.keyboard)
//     }
//   })

//   await bot.launch()
//   console.log('Bot started')
// }

// start()

import 'dotenv/config'
import { Telegraf } from 'telegraf'
import mongoose from 'mongoose'

import { getOrCreateUser, setState, goBack } from './fsm'
import {
  renderStart,
  renderE1,
  renderReady,
  renderBudget,
  renderStyle,
  renderDelivery,
  renderAddress,
  renderContact,
  renderConfirm,
  renderDone,
} from './screens'

const bot = new Telegraf(process.env.BOT_TOKEN!)

async function start() {
  await mongoose.connect(process.env.MONGO_URI!)
  console.log('Mongo connected')

  /* ================= /start ================= */
  bot.start(async (ctx) => {
    await getOrCreateUser(ctx.from.id, ctx.from.username)
    await setState(ctx.from.id, 'START')

    const s = renderStart()
    await ctx.reply(s.text, s.keyboard)
  })

  /* ================= TYPE ================= */
  bot.action('E1', async (ctx) => {
    await setState(ctx.from!.id, 'E1_CHOOSE_TYPE', 'START')
    const s = renderE1()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= READY ================= */
  bot.action('E2_READY', async (ctx) => {
    await setState(ctx.from!.id, 'E2_READY', 'E1_CHOOSE_TYPE')
    const s = renderReady()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= CUSTOM → BUDGET ================= */
  bot.action('E2_CUSTOM', async (ctx) => {
    await setState(ctx.from!.id, 'E2_BUDGET', 'E1_CHOOSE_TYPE')
    const s = renderBudget()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= BACK ================= */
  bot.action('BACK', async (ctx) => {
    const prev = await goBack(ctx.from!.id)
    if (!prev) return

    if (prev === 'E1_CHOOSE_TYPE') {
      const s = renderE1()
      return ctx.editMessageText(s.text, s.keyboard)
    }

    if (prev === 'E2_BUDGET') {
      const s = renderBudget()
      return ctx.editMessageText(s.text, s.keyboard)
    }

    if (prev === 'E2_STYLE') {
      const s = renderStyle()
      return ctx.editMessageText(s.text, s.keyboard)
    }

    if (prev === 'E3_DELIVERY') {
      const s = renderDelivery()
      return ctx.editMessageText(s.text, s.keyboard)
    }

    if (prev === 'CONFIRM') {
      const s = renderContact()
      return ctx.editMessageText(s.text, s.keyboard)
    }
  })

  /* ================= BUDGET ================= */
  const BUDGET_MAP = {
    BUDGET_3000: 'до 3000',
    BUDGET_3000_5000: '3000–5000',
    BUDGET_5000_7000: '5000–7000',
    BUDGET_7000: '7000+',
  }

  Object.keys(BUDGET_MAP).forEach((action) => {
    bot.action(action, async (ctx) => {
      await ctx.answerCbQuery()
      await setState(ctx.from!.id, 'E2_STYLE', 'E2_BUDGET')

      const s = renderStyle()
      await ctx.editMessageText(s.text, s.keyboard)
    })
  })

  bot.action('BUDGET_MANUAL', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_BUDGET_TEXT', 'E2_BUDGET')
    await ctx.editMessageText('Напишите бюджет в свободной форме 💬')
  })

  /* ================= STYLE ================= */
  const STYLE_MAP = {
    STYLE_ANY: 'Без разницы',
    STYLE_SOFT: 'Нежный / светлый',
    STYLE_BRIGHT: 'Яркий',
  }

  Object.keys(STYLE_MAP).forEach((action) => {
    bot.action(action, async (ctx) => {
      await ctx.answerCbQuery()
      await setState(ctx.from!.id, 'E3_DELIVERY', 'E2_STYLE')

      const s = renderDelivery()
      await ctx.editMessageText(s.text, s.keyboard)
    })
  })

  bot.action('STYLE_MANUAL', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_STYLE_TEXT', 'E2_STYLE')
    await ctx.editMessageText('Опишите желаемый стиль 💬')
  })

  /* ================= DELIVERY ================= */
  bot.action('DELIVERY_COURIER', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_ADDRESS', 'E3_DELIVERY')
    const s = renderAddress()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  bot.action('DELIVERY_PICKUP', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')
    const s = renderContact()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= CONTACT ================= */
  bot.on('contact', async (ctx) => {
    const phone = ctx.message.contact.phone_number
    await setState(ctx.from!.id, 'CONFIRM')

    const text = 'Проверьте заказ 👇\n\n' + `Телефон: ${phone}`

    const s = renderConfirm(text)
    await ctx.reply(s.text, s.keyboard)
  })

  /* ================= TEXT FSM ================= */
  bot.on('text', async (ctx) => {
    const user = await getOrCreateUser(ctx.from.id)
    const text = ctx.message.text

    if (user.state === 'WAIT_ADDRESS') {
      await setState(ctx.from.id, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')
      const s = renderContact()
      return ctx.reply(s.text, s.keyboard)
    }

    if (user.state === 'WAIT_PHONE_TEXT') {
      await setState(ctx.from.id, 'CONFIRM')
      const s = renderConfirm(`Телефон: ${text}`)
      return ctx.reply(s.text, s.keyboard)
    }

    if (user.state === 'WAIT_STYLE_TEXT') {
      await setState(ctx.from.id, 'E3_DELIVERY')
      const s = renderDelivery()
      return ctx.reply(s.text, s.keyboard)
    }

    if (user.state === 'WAIT_BUDGET_TEXT') {
      await setState(ctx.from.id, 'E2_STYLE')
      const s = renderStyle()
      return ctx.reply(s.text, s.keyboard)
    }
  })

  /* ================= CONFIRM ================= */
  bot.action('CONFIRM_SEND', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'DONE')
    const s = renderDone()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  await bot.launch()
  console.log('Bot started')
}

start()
