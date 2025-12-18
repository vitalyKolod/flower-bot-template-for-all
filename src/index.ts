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
} from './screens'

const bot = new Telegraf(process.env.BOT_TOKEN!)

async function start() {
  await mongoose.connect(process.env.MONGO_URI!)
  console.log('Mongo connected')

  /* ================= /start ================= */
  bot.start(async (ctx) => {
    const tgId = ctx.from.id
    await getOrCreateUser(tgId, ctx.from.username)
    await setState(tgId, 'START')

    const s = renderStart()
    await ctx.reply(s.text, s.keyboard)
  })

  /* ================= E1 ================= */
  bot.action('E1', async (ctx) => {
    const tgId = ctx.from!.id
    await setState(tgId, 'E1_CHOOSE_TYPE', 'START')

    const s = renderE1()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= READY ================= */
  bot.action('E2_READY', async (ctx) => {
    const tgId = ctx.from!.id
    await setState(tgId, 'E2_READY', 'E1_CHOOSE_TYPE')

    const s = renderReady()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= CUSTOM → BUDGET ================= */
  bot.action('E2_CUSTOM', async (ctx) => {
    const tgId = ctx.from!.id
    await setState(tgId, 'E2_CUSTOM', 'E1_CHOOSE_TYPE')

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

    if (prev === 'E2_CUSTOM') {
      const s = renderBudget()
      return ctx.editMessageText(s.text, s.keyboard)
    }

    if (prev === 'E3_DELIVERY' || prev === 'WAIT_ADDRESS' || prev === 'WAIT_PHONE_TEXT') {
      const s = renderDelivery()
      return ctx.editMessageText(s.text, s.keyboard)
    }
  })

  /* ================= БЮДЖЕТ ================= */
  const BUDGET_MAP = {
    BUDGET_3000: 'до 3000',
    BUDGET_3000_5000: '3000–5000',
    BUDGET_5000_7000: '5000–7000',
    BUDGET_7000: '7000+',
  }

  Object.keys(BUDGET_MAP).forEach((action) => {
    bot.action(action, async (ctx) => {
      await ctx.answerCbQuery()
      await setState(ctx.from!.id, 'E2_CUSTOM', 'E2_CUSTOM')

      const s = renderStyle()
      await ctx.editMessageText(s.text, s.keyboard)
    })
  })

  bot.action('BUDGET_MANUAL', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_BUDGET_TEXT', 'E2_CUSTOM')
    await ctx.editMessageText('Напишите бюджет в свободной форме 💬')
  })

  /* ================= СТИЛЬ ================= */
  const STYLE_MAP = {
    STYLE_ANY: 'Без разницы',
    STYLE_SOFT: 'Нежный / светлый',
    STYLE_BRIGHT: 'Яркий',
  }

  Object.keys(STYLE_MAP).forEach((action) => {
    bot.action(action, async (ctx) => {
      await ctx.answerCbQuery()
      await setState(ctx.from!.id, 'E3_DELIVERY', 'E2_CUSTOM')

      const s = renderDelivery()
      await ctx.editMessageText(s.text, s.keyboard)
    })
  })

  bot.action('STYLE_MANUAL', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_STYLE_TEXT', 'E2_CUSTOM')
    await ctx.editMessageText('Опишите желаемый стиль 💬')
  })

  /* ================= ДОСТАВКА ================= */
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

  /* ================= КОНТАКТ ================= */

  // 📱 Отправить номер (request_contact)
  bot.action('CONTACT_REQUEST', async (ctx) => {
    const tgId = ctx.from!.id
    await ctx.answerCbQuery()

    await setState(tgId, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')

    await ctx.reply('Нажмите кнопку ниже, чтобы отправить номер 📱', {
      reply_markup: {
        keyboard: [[{ text: '📱 Отправить номер', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    })
  })

  // ✍️ Ввести вручную
  bot.action('CONTACT_MANUAL', async (ctx) => {
    const tgId = ctx.from!.id
    await ctx.answerCbQuery()

    await setState(tgId, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')

    await ctx.editMessageText('Введите номер телефона 📞')
  })

  /* ================= TEXT FSM ================= */
  bot.on('text', async (ctx) => {
    const user = await getOrCreateUser(ctx.from.id)
    const text = ctx.message.text

    bot.on('contact', async (ctx) => {
      const tgId = ctx.from.id
      const phone = ctx.message.contact.phone_number

      const user = await getOrCreateUser(tgId)
      if (user.state !== 'WAIT_PHONE_TEXT') return

      await setState(tgId, 'E3_DELIVERY')

      await ctx.reply(`Номер принят 📞\n${phone}\n\n(дальше будет подтверждение)`)
    })

    // адрес
    if (user.state === 'WAIT_ADDRESS') {
      await setState(ctx.from.id, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')
      await ctx.reply(`Адрес принят 📍\n${text}`)

      const s = renderContact()
      await ctx.reply(s.text, s.keyboard)
      return
    }

    // телефон
    if (user.state === 'WAIT_PHONE_TEXT') {
      await setState(ctx.from.id, 'E3_DELIVERY')
      await ctx.reply(`Номер принят 📞\n${text}\n\n(дальше будет подтверждение)`)
      return
    }

    // стиль вручную
    if (user.state === 'WAIT_STYLE_TEXT') {
      await setState(ctx.from.id, 'E3_DELIVERY')
      const s = renderDelivery()
      return ctx.reply(s.text, s.keyboard)
    }

    // бюджет вручную
    if (user.state === 'WAIT_BUDGET_TEXT') {
      await setState(ctx.from.id, 'E2_CUSTOM')
      const s = renderStyle()
      return ctx.reply(s.text, s.keyboard)
    }
  })

  await bot.launch()
  console.log('Bot started')
}

start()
