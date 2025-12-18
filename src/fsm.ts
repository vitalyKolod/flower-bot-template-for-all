import { UserModel, UserState } from './models/User'

export async function getOrCreateUser(tgId: number, username?: string) {
  let user = await UserModel.findOne({ tgId })

  if (!user) {
    user = await UserModel.create({
      tgId,
      username,
      state: 'START',
      history: [],
    })
  }

  return user
}

export async function setState(userId: number, newState: UserState, prevState?: UserState) {
  await UserModel.updateOne(
    { tgId: userId },
    {
      state: newState,
      ...(prevState && { $push: { history: prevState } }),
    }
  )
}

export async function goBack(userId: number) {
  const user = await UserModel.findOne({ tgId: userId })
  if (!user || user.history.length === 0) return null

  const prev = user.history[user.history.length - 1]

  await UserModel.updateOne(
    { tgId: userId },
    {
      state: prev,
      $pop: { history: 1 },
    }
  )

  return prev
}
