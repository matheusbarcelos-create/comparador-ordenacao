'use strict';
require('dotenv').config();

const banco = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'comparador_ordenacao'
};
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(banco.database)) {
  throw new Error('DB_NAME deve conter apenas letras, números e sublinhado e começar por letra/sublinhado.');
}
if (!Number.isInteger(banco.port) || banco.port < 1 || banco.port > 65535) {
  throw new Error('DB_PORT inválida.');
}
module.exports = { banco };
