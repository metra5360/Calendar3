# Общий календарь — настройка и деплой

## 1. Создать проект в Supabase

1. Зайдите на [supabase.com](https://supabase.com) и войдите.
2. **New project** → выберите организацию, имя (например, `shared-calendar`), задайте пароль БД и регион.
3. Дождитесь создания проекта.

---

## 2. Создать таблицу и политики RLS

В Supabase: **SQL Editor** → **New query**. Вставьте и выполните:

```sql
-- Таблица: одна запись на (дата, пользователь)
CREATE TABLE calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  "user" text NOT NULL CHECK ("user" IN ('Я', 'Друг')),
  status text NOT NULL DEFAULT 'green' CHECK (status IN ('green', 'orange', 'red'))
);

-- Уникальный индекс для upsert по (date, user)
CREATE UNIQUE INDEX calendar_entries_date_user ON calendar_entries (date, "user");

-- Анонимный доступ без авторизации
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read" ON calendar_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert" ON calendar_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update" ON calendar_entries
  FOR UPDATE USING (true);
```

---

## 3. Включить Realtime

1. В Supabase: **Database** → **Replication**.
2. Найдите таблицу `calendar_entries` и включите для неё Realtime (переключатель в положение on).

---

## 4. URL и anon-ключ

1. **Settings** (шестерёнка) → **API**.
2. Скопируйте **Project URL** и ключ **anon public**.

В файле **config.js** замените значения:

```js
window.SUPABASE_URL = "https://ВАШ_ПРОЕКТ.supabase.co";
window.SUPABASE_ANON_KEY = "ваш-anon-ключ";
```

---

## 5. Запуск локально

**Без Supabase:** откройте **index.html** в браузере (двойной клик или `open index.html`). Календарь работает локально: можно переключать статусы по клику, но данные не сохраняются и не синхронизируются.

**С Supabase:** после шагов 1–4 откройте приложение так же (или через статический сервер при необходимости):
- двойной клик по **index.html** или команда: `open index.html`;
- либо `npx serve .` и откройте выданный URL (если нужен сервер из-за CORS).

---

## 6. Деплой на Vercel (перетаскивание)

1. Зайдите на [vercel.com](https://vercel.com) и войдите.
2. **Add New** → **Project** → импортируйте репозиторий или деплой без Git.
3. **Деплой без Git:**  
   [vercel.com/new](https://vercel.com/new) → перетащите папку проекта (с `index.html`, `config.js` и т.д.) в область загрузки.  
   Vercel выдаст URL вида `https://your-app-xxx.vercel.app`.
4. Откройте сайт и проверьте. Кнопка **Скопировать ссылку** копирует текущий URL страницы для шаринга.

**Важно:** URL и anon-ключ Supabase заданы в `config.js` и доступны во фронтенде — для варианта без авторизации это допустимо. Секретный ключ в `config.js` не используйте.

---

## Кратко

| Шаг | Действие |
|-----|----------|
| 1 | Создать проект в Supabase |
| 2 | Выполнить SQL выше (таблица + RLS) |
| 3 | Включить Realtime для `calendar_entries` |
| 4 | Подставить URL и anon-ключ в `config.js` |
| 5 | Открыть `index.html` (или через `npx serve .`) |
| 6 | Задеплоить папку на Vercel и делиться ссылкой |
