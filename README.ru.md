![ViewCount](https://hits.sh/github.com/war100ck/sql-multi-tool.svg?style=flat-square) ![Downloads](https://img.shields.io/github/downloads/war100ck/sql-multi-tool/total)


# SQL Multi Tool

<p align="center">
  <img src="screen/1.png" width="750" height="280" alt="SQL Multi Tool">
</p>

<p align="center">
  <b>Многофункциональный инструмент для управления Microsoft SQL Server — восстановление, бэкап и удаление баз данных.</b><br>
  <a href="README.md">Read in English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Rust-1.70%2B-orange?logo=rust" alt="Rust 1.70+">
  <img src="https://img.shields.io/badge/Tauri-1.x-blue?logo=tauri" alt="Tauri 1.x">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT">
  <img src="https://img.shields.io/badge/Platform-Windows-blue?logo=windows" alt="Windows">
</p>

## Стек технологий

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Backend | Rust + Tokio + Tiberius | 1.70+ |
| Frontend | Tauri (WebView2), Vanilla JS, HTML5, CSS3 | — |
| UI-стиль | Custom Metro UI, темная тема | — |

---

## 📸 Скриншот

<p align="center">
  <i>Main interface</i><br>
  <img src="screen/2.png" width="760" alt="Screenshot">
</p>

---

## Требования

- **Rust** 1.70+ (https://rustup.rs/)
- **Tauri CLI**: `cargo install tauri-cli`
- **WebView2 Runtime** (Windows 10/11 — устанавливается автоматически)
- **Microsoft SQL Server** с включенным TCP/IP (порт 1433)

## Установка и сборка

```bash
# 1. Распакуйте проект
cd sql_multi_tool

# 2. Установите Tauri CLI (один раз)
cargo install tauri-cli

# 3. Соберите release (скрытая консоль)
build.bat

# Или dev-режим
dev.bat
```

## Структура проекта

```
sql_multi_tool/
├── src/                          # Frontend
│   ├── index.html               # UI (Metro UI, i18n)
│   ├── style.css                # Темная тема, четкие углы
│   ├── app.js                   # Логика + i18n + массовые операции
│   └── icon.png                 # Иконка приложения
├── src-tauri/                    # Backend (Rust)
│   ├── src/main.rs              # Команды: test, restore, backup, delete
│   ├── Cargo.toml               # Зависимости
│   ├── tauri.conf.json          # Конфигурация окна (frameless)
│   └── icons/                   # Иконки для сборки
├── build.bat                     # Сборка release
├── dev.bat                       # Dev-режим
└── README.md                     # Этот файл
```

## Функционал

### Вкладка "Восстановление" (Restore)
- **Массовое восстановление**: выбор нескольких `.bak` файлов через диалог
- Автоматическое определение папок для восстановления из SQL Server
- `RESTORE DATABASE` с `MOVE` файлов (.mdf / .ldf)
- Прогресс-бар и журнал операций с подробным логом
- Поддержка замены существующих баз (`REPLACE`)

### Вкладка "Управление" (Manage)
- Список пользовательских баз данных (исключая системные)
- Отображение размера и статуса (Online/Offline)
- **Массовый бэкап**: выбор нескольких баз чекбоксами → создание `.bak` для каждой
- **Массовое удаление**: выбор нескольких баз → удаление с подтверждением
- Два формата имени бэкапа:
  - `ИмяБД_20260714_145541.bak` (с датой и временем)
  - `ИмяБД.bak` (простой)

### Вкладка "Настройки" (Settings)
- Сервер, логин, пароль для SQL Server
- Тестирование подключения
- Автосохранение в `localStorage`
- Выбор формата имени бэкапа по умолчанию

## Мультиязычность (i18n)

Переключение языка через кнопки **RU / EN** в title bar:
- **Русский** (по умолчанию)
- **English**

Язык сохраняется в `localStorage`.

## Уведомления

- **Только in-app toast-уведомления** (без Windows Notifications)
- Цветовая индикация: зелёный (успех), красный (ошибка), синий (инфо)
- Автоскрытие через 4 секунды

## UI-стилистика

- **Metro UI**: четкие углы, плоский дизайн, без скруглений
- **Темная тема**: глубокие синие и серые тона
- **Frameless окно**: кастомный title bar с drag-region
- **SVG-иконки** на всех кнопках и в навигации
- **Скрытая консоль** в релизе (`#![windows_subsystem = "windows"]`)
- **Отключено контекстное меню** ПКМ

## Безопасность

- Пароль хранится локально в `localStorage` (не отправляется никуда)
- Подключение через SQL Authentication (логин/пароль)
- `trust_cert()` для упрощения (в продакшене рекомендуется настроить сертификаты)

---

## 📜 Лицензия

Этот проект распространяется под лицензией **MIT License**.

Подробности см. в файле [LICENSE](LICENSE).
