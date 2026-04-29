# 🚀 Запуск приложения в Telegram

## Шаг 1 — Установка зависимостей

```bash
cd tma-app
npm install
```

## Шаг 2 — Локальный запуск

```bash
npm run dev
```

Открой http://localhost:5173 — увидишь приложение в браузере.

---

## Шаг 3 — Деплой (публичный URL для Telegram)

Telegram требует HTTPS-ссылку. Самый быстрый способ — **Vercel**:

### Через Vercel (бесплатно, 2 минуты)

1. Зайди на https://vercel.com и войди через GitHub
2. Создай репозиторий на GitHub и залей папку `tma-app`
3. В Vercel нажми "Add New Project" → выбери репозиторий
4. Vercel сам определит Vite — просто нажми Deploy
5. Получишь URL вида: `https://your-app.vercel.app`

### Альтернатива — Netlify

1. Зайди на https://netlify.com
2. Перетащи папку `dist` (после `npm run build`) прямо в браузер
3. Получишь URL моментально

---

## Шаг 4 — Подключить Mini App к боту

1. Открой Telegram → найди **@BotFather**
2. Отправь `/mybots` → выбери своего бота
3. Нажми **Bot Settings → Menu Button → Configure menu button**
4. Введи URL твоего деплоя: `https://your-app.vercel.app`
5. Введи название кнопки: "Открыть трекер"

Либо через команду:
```
/newapp → выбери бота → введи URL
```

---

## Шаг 5 — Подключение Supabase (база данных)

1. Зайди на https://supabase.com → создай проект
2. Создай файл `.env` в корне `tma-app`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. Создай таблицы в Supabase SQL Editor:

```sql
-- Привычки
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null,
  title text not null,
  frequency text default 'daily',
  completed_dates text[] default '{}',
  created_at timestamptz default now()
);

-- Цели
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null,
  title text not null,
  start_date date,
  end_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Финансы
create table finance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null,
  type text not null,
  amount numeric not null,
  category text not null,
  note text,
  date date not null,
  created_at timestamptz default now()
);

-- Дневник
create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null,
  date date unique not null,
  mood int not null,
  mood_note text,
  text text,
  created_at timestamptz default now()
);
```

4. В `src/store/` замени `persist` на вызовы Supabase API (делаем вместе по запросу!)

---

## Структура проекта

```
src/
├── types/index.ts          — TypeScript интерфейсы
├── store/
│   ├── habitsStore.ts      — Zustand: привычки
│   ├── goalsStore.ts       — Zustand: цели
│   ├── financeStore.ts     — Zustand: финансы
│   └── diaryStore.ts       — Zustand: дневник
├── components/
│   ├── TabBar.tsx          — Нижняя навигация
│   ├── CalendarHeader.tsx  — Шапка с календарём
│   ├── WeekCalendar.tsx    — Недельный вид
│   └── MonthCalendar.tsx   — Месячный вид
└── pages/
    ├── Home.tsx            — Главная (дашборд)
    ├── Habits.tsx          — Привычки
    ├── Goals.tsx           — Цели
    ├── Finance.tsx         — Финансы
    └── Diary.tsx           — Дневник
```

---

## Что дальше (делаем вместе)

- [ ] Подключить Supabase для синхронизации данных между устройствами
- [ ] Авторизация через Telegram (initDataUnsafe.user.id)
- [ ] Push-уведомления через бота
- [ ] Анимации переходов между экранами
- [ ] Экраны добавления привычки с расширенными настройками
