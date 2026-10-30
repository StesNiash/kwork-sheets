# Архитектура

```text
apps-script/
  Code.gs          onOpen, setup, buildDailyReport, notifyOwner_
  appsscript.json  scopes и timezone
mock/
  sheet_report.py  локальная логика и парсинг денег
  sample_orders.csv
tests/
  test_sheet_report.py
scripts/
  build_demo.py
```

## Поток

```text
Orders (Google Sheets)
        │
        ▼
buildDailyReport
        │
        ├── Report: количество / сумма / статусы
        └── MailApp.sendEmail (если NOTIFY_EMAIL)
```

Локально тот же расчёт выполняется над CSV:

```text
sample_orders.csv → load_orders → build_report → report.json / index.html
```

## Решения

### Отчёт на отдельном листе

`Orders` остаётся источником, `Report` можно очищать и перезаписывать. Это проще проверить и не портит исходные данные.

### Email опционален

Если `NOTIFY_EMAIL` не задан, отчёт всё равно собирается. Это позволяет начать без почтовых разрешений.

### Локальный мок

Apps Script нельзя запустить в CI, поэтому чистые расчёты вынесены в Python-мок. Он не заменяет проверку в Google, но ловит ошибки в формулах и форматах.

## Границы

- Нет Google API-клиента и `clasp`-деплоя.
- Нет произвольных формул.
- Нет внешних интеграций.
- Нет клиентских данных.
