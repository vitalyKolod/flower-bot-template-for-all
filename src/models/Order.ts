import { Schema, model } from 'mongoose'

export type OrderStatus = 'new' | 'in_work' | 'accepted' | 'rejected' | 'done'

const OrderSchema = new Schema(
  {
    userTgId: {
      type: Number,
      required: true,
    },

    // READY | CUSTOM
    type: {
      type: String,
      enum: ['READY', 'CUSTOM'],
      required: true,
    },

    // для CUSTOM
    budget: {
      type: String,
      default: null,
    },

    style: {
      type: String,
      default: null,
    },

    // для READY
    refText: {
      type: String,
      default: null,
    },

    refPhotos: {
      type: [String], // file_id
      default: [],
    },

    // доставка
    deliveryType: {
      type: String,
      enum: ['COURIER', 'PICKUP'],
      required: true,
    },

    address: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['new', 'in_work', 'accepted', 'rejected', 'done'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
)

export const Order = model('Order', OrderSchema)

export async function getActiveOrder(userTgId: number) {
  return Order.findOne({ userTgId, status: 'new' }).sort({ createdAt: -1 })
}
