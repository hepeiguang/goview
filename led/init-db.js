const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
  console.log('正在连接 MySQL...');
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'password',
    multipleStatements: true
  });
  console.log('✅ 连接成功');

  try {
    // 创建数据库
    await connection.query('CREATE DATABASE IF NOT EXISTS led CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ 数据库 led 创建成功');

    // 使用数据库
    await connection.query('USE led');

    // 读取 SQL 文件
    const sqlFile = path.join(__dirname, 'db/mysql.sql');
    console.log('读取 SQL 文件:', sqlFile);
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // 执行 SQL
    await connection.query(sql);
    console.log('✅ 数据表初始化成功');

    // 验证表
    const [tables] = await connection.query('SHOW TABLES');
    console.log('已创建的表:', tables.map(t => Object.values(t)[0]).join(', '));

    // 验证用户数据
    const [users] = await connection.query('SELECT id, username, nick FROM pf_user LIMIT 5');
    console.log('用户数据:', JSON.stringify(users));

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await connection.end();
  }
}

initDB();
