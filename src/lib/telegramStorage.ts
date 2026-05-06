/**
 * Telegram CloudStorage adapter для Zustand persist
 *
 * Данные хранятся в облаке Telegram — синхронизируются
 * автоматически между телефоном и компьютером.
 * Если приложение открыто вне Telegram — fallback на localStorage.
 */
import { StateStorage } from 'zustand/middleware'

// Проверка: запущены ли мы внутри Telegram
const isTelegram = () =>
  typeof window !== 'undefined' &&
  !!window.Telegram?.WebApp?.CloudStorage

// Получить значение
const getItem = (key: string): Promise<string | null> =>
  new Promise((resolve) => {
    if (!isTelegram()) {
      resolve(localStorage.getItem(key))
      return
    }
    window.Telegram!.WebApp.CloudStorage.getItem(key, (err: unknown, value: string) => {
      if (err || value === undefined) {
        // Попробуем localStorage как резерв
        resolve(localStorage.getItem(key))
      } else {
        resolve(value || null)
      }
    })
  })

// Сохранить значение
const setItem = (key: string, value: string): Promise<void> =>
  new Promise((resolve) => {
    if (!isTelegram()) {
      localStorage.setItem(key, value)
      resolve()
      return
    }
    window.Telegram!.WebApp.CloudStorage.setItem(key, value, (err: unknown) => {
      if (err) {
        // Резервный вариант — localStorage
        localStorage.setItem(key, value)
      }
      resolve()
    })
  })

// Удалить значение
const removeItem = (key: string): Promise<void> =>
  new Promise((resolve) => {
    if (!isTelegram()) {
      localStorage.removeItem(key)
      resolve()
      return
    }
    window.Telegram!.WebApp.CloudStorage.removeItem(key, (err: unknown) => {
      if (err) {
        localStorage.removeItem(key)
      }
      resolve()
    })
  })

export const telegramStorage: StateStorage = {
  getItem,
  setItem,
  removeItem,
}
