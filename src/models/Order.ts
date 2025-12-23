import { Schema, model, Document } from 'mongoose'

export type OrderStatus = 'new' | 'in_work' | 'accepted' | 'rejected' | 'done'

/* ================= TYPE ================= */

export interface OrderDoc extends Document {
  userTgId: number
  type: 'READY' | 'CUSTOM'

  // CUSTOM
  budget?: string | null
  style?: string | null

  // READY
  refText?: string | null
  refPhotos: string[]

  // delivery
  deliveryType: 'COURIER' | 'PICKUP'
  address?: string | null
  phone: string

  status: OrderStatus
}

/* ================= SCHEMA ================= */

const OrderSchema = new Schema<OrderDoc>(
  {
    userTgId: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ['READY', 'CUSTOM'],
      required: true,
    },

    budget: {
      type: String,
      default: null,
    },

    style: {
      type: String,
      default: null,
    },

    refText: {
      type: String,
      default: null,
    },

    refPhotos: {
      type: [String],
      default: [],
    },

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

/* ================= MODEL ================= */

export const Order = model<OrderDoc>('Order', OrderSchema)

/* ================= HELPERS ================= */

export async function getActiveOrder(userTgId: number) {
  return Order.findOne({ userTgId, status: 'new' }).sort({ createdAt: -1 })
}
