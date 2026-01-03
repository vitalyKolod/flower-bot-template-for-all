import { Schema, model } from 'mongoose'

export type UserState =
  | 'START'
  | 'E1_CHOOSE_TYPE'
  | 'E2_READY'
  | 'E2_CUSTOM'
  | 'WAIT_BUDGET_TEXT'
  | 'WAIT_STYLE_TEXT'
  | 'DELIVERY_COURIER'
  | 'DELIVERY_PICKUP'
  | 'WAIT_ADDRESS'
  | 'E3_DELIVERY'
  | 'WAIT_PHONE_TEXT'
  | 'WAIT_CLIENT_NAME'
  | 'CONFIRM'
  | 'DONE'
  | 'E2_STYLE'
  | 'E2_BUDGET'
  | 'WAIT_READY_CONTENT'
  | 'WAIT_MANAGER_REPLY'
  | 'ADMIN_HOME'
  | 'ADMIN_ORDERS_PREV'
  | 'ADMIN_ORDERS_NEXT'
  | 'ADMIN_FILTER'
  | 'ADMIN_HOME'
  | 'ADMIN_ORDERS_LIST'

const UserSchema = new Schema(
  {
    tgId: { type: Number, required: true, unique: true },
    username: { type: String },
    state: { type: String, default: 'START' },
    history: { type: [String], default: [] },

    isAdmin: { type: Boolean, default: false },
    isManager: { type: Boolean, default: false },

    subscribed: { type: Boolean, default: true },

    managerReplyOrderId: {
      type: String,
      default: null,
    },
    activeOrderId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
)

export const UserModel = model('User', UserSchema)
