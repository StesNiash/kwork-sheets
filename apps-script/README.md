# Apps Script

## Файлы

- `Code.gs` — меню, создание листов, отчёт и письмо.
- `appsscript.json` — timezone и минимальные OAuth scopes.

## Установка

1. Откройте копию таблицы.
2. **Расширения → Apps Script**.
3. Замените содержимое `Code.gs`.
4. В **Project Settings** включите показ `appsscript.json` и замените файл.
5. Выполните `setup`, затем `buildDailyReport`.
6. При необходимости добавьте `NOTIFY_EMAIL` в Script Properties.

## Ожидаемые листы

`Orders`:

```text
date | customer | status | amount
```

`Report` создаётся автоматически.

## Ограничения

Скрипт не устанавливает триггер сам: его нужно добавить вручную в **Triggers**. Это сделано намеренно, чтобы установка не включала фоновые запуски без подтверждения владельца.
