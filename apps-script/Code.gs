const SETTINGS = {
  ordersSheet: 'Orders',
  reportSheet: 'Report',
  notifyEmailProperty: 'NOTIFY_EMAIL',
  headers: ['date', 'customer', 'status', 'amount']
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Отчёты')
    .addItem('Собрать отчёт', 'buildDailyReport')
    .addItem('Создать листы', 'setup')
    .addToUi();
}

function setup() {
  const book = SpreadsheetApp.getActive();
  let orders = book.getSheetByName(SETTINGS.ordersSheet);
  if (!orders) {
    orders = book.insertSheet(SETTINGS.ordersSheet);
  }
  if (orders.getLastRow() === 0) {
    orders.getRange(1, 1, 1, SETTINGS.headers.length).setValues([SETTINGS.headers]);
    orders.setFrozenRows(1);
  }
  let report = book.getSheetByName(SETTINGS.reportSheet);
  if (!report) {
    report = book.insertSheet(SETTINGS.reportSheet);
  }
  return { orders: orders.getName(), report: report.getName() };
}

function buildDailyReport() {
  const book = SpreadsheetApp.getActive();
  const orders = book.getSheetByName(SETTINGS.ordersSheet);
  const reportSheet = book.getSheetByName(SETTINGS.reportSheet) || book.insertSheet(SETTINGS.reportSheet);
  if (!orders) {
    throw new Error('Нет листа ' + SETTINGS.ordersSheet);
  }

  const values = orders.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('В Orders нет строк с заказами');
  }

  const headers = values[0].map(function (value) { return String(value).trim().toLowerCase(); });
  const index = {};
  headers.forEach(function (header, position) { index[header] = position; });
  ['date', 'customer', 'status', 'amount'].forEach(function (name) {
    if (index[name] === undefined) {
      throw new Error('В Orders нет колонки ' + name);
    }
  });

  const summary = {
    orders: 0,
    total: 0,
    byStatus: {},
    latestDate: ''
  };

  for (let row = 1; row < values.length; row += 1) {
    const record = values[row];
    if (!record.join('').trim()) {
      continue;
    }
    const status = String(record[index.status] || 'без статуса').trim();
    const amount = parseAmount_(record[index.amount]);
    const date = String(record[index.date] || '').trim();
    summary.orders += 1;
    summary.total += amount;
    if (!summary.byStatus[status]) {
      summary.byStatus[status] = { count: 0, total: 0 };
    }
    summary.byStatus[status].count += 1;
    summary.byStatus[status].total += amount;
    if (date > summary.latestDate) {
      summary.latestDate = date;
    }
  }

  const rows = [['Показатель', 'Значение'], ['Заказов', summary.orders], ['Сумма', summary.total], ['Последняя дата', summary.latestDate], ['', ''], ['Статус', 'Количество', 'Сумма']];
  Object.keys(summary.byStatus).sort().forEach(function (status) {
    rows.push([status, summary.byStatus[status].count, summary.byStatus[status].total]);
  });

  reportSheet.clear();
  reportSheet.getRange(1, 1, rows.length, 3).setValues(rows);
  reportSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  reportSheet.getRange(rows.length - Object.keys(summary.byStatus).length, 1, 1, 3).setFontWeight('bold');
  reportSheet.autoResizeColumns(1, 3);

  notifyOwner_(summary);
  return summary;
}

function notifyOwner_(summary) {
  const email = PropertiesService.getScriptProperties().getProperty(SETTINGS.notifyEmailProperty);
  if (!email) {
    return;
  }
  const subject = 'Отчёт по заказам: ' + summary.orders + ' шт.';
  const body = 'Заказов: ' + summary.orders + '\nСумма: ' + summary.total + '\nПоследняя дата: ' + summary.latestDate;
  MailApp.sendEmail(email, subject, body);
}

function parseAmount_(value) {
  if (typeof value === 'number') {
    return value;
  }
  const normalized = String(value || '').replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const amount = Number(normalized);
  return isNaN(amount) ? 0 : amount;
}
