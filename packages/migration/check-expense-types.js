#!/usr/bin/env node
const Database = require('better-sqlite3');

const DB_PATH = '/Users/basilsergius/Downloads/Топливомер_БД_20221120_160204_1281347789493688515.db3';

const db = new Database(DB_PATH, { readonly: true });

console.log('\n=== Expense Types ===');
const expenseTypes = db.prepare('SELECT * FROM expense_types').all();
console.table(expenseTypes);

console.log('\n=== Sample Costs with Types ===');
const costs = db.prepare('SELECT costs.*, expense_types.title as type_name FROM costs LEFT JOIN expense_types ON costs.type = expense_types._id LIMIT 10').all();
console.table(costs);

console.log('\n=== Expense Types Mapping ===');
const mapping = {
  0: 'Other',        // Другое
  1: 'Accessories',  // Аксессуары
  2: 'Parts',        // Запчасти
  3: 'Loan',         // Кредит
  4: 'License',      // Лицензия
  5: 'Parking',      // Парковка
  6: 'Registration', // Регистрация
  7: 'Service',      // Сервис
  8: 'Insurance',    // Страхование
  9: 'Fines',        // Штрафы
  10: 'Wash',        // Мойка
  11: 'Tax'          // Налог
};
console.table(mapping);

db.close();
