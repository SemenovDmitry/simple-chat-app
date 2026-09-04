# Инициализируем базовый образ с актуальной версией Node.js
FROM node:24-alpine

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

WORKDIR /app

# Важно: говорим pnpm, что мы в CI (неинтерактивная среда)
ENV CI=true

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Устанавливаем зависимости
RUN pnpm install --no-frozen-lockfile

# Копируем весь исходный код проекта
COPY . .

# Компилируем TypeScript код в JavaScript
RUN pnpm run build

# Переменная окружения для продакшена
ENV NODE_ENV=production

# Открываем порт для Render
EXPOSE 10000

# Запускаем скомпилированный код
CMD ["pnpm", "start"]