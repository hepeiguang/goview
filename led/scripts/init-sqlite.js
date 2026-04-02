/**
 * SQLite 数据库初始化脚本 (使用 sql.js - 纯 JavaScript 实现)
 * 使用方法: node scripts/init-sqlite.js
 *
 * 优点: 无需编译，跨平台兼容
 */

const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../db/led.sqlite')
const sqlPath = path.join(__dirname, '../db/init_sqlite.sql')

console.log('📁 数据库路径:', dbPath)
console.log('📄 初始化脚本:', sqlPath)

// 确保 db 目录存在
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
  console.log('📂 创建 db 目录')
}

// 删除旧数据库
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
  console.log('🗑️  已删除旧数据库')
}

async function initDatabase() {
  // 动态导入 sql.js
  const initSqlJs = require('sql.js')
  const SQL = await initSqlJs()

  console.log('🔄 正在初始化数据库...')

  // 创建数据库
  const db = new SQL.Database()

  // 读取 SQL 文件
  const sql = fs.readFileSync(sqlPath, 'utf8')

  // 清理注释
  const cleanSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')

  // 分割并执行 SQL
  const statements = cleanSql
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  let successCount = 0
  let errorCount = 0

  for (const stmt of statements) {
    try {
      db.run(stmt)
      successCount++
    } catch (err) {
      // 忽略 UNIQUE 约束错误（数据已存在）
      if (!err.message.includes('UNIQUE constraint failed')) {
        console.log(`⚠️ SQL 执行警告: ${err.message.substring(0, 100)}`)
      }
      errorCount++
    }
  }

  console.log(`✅ SQL 执行完成: ${successCount} 成功, ${errorCount} 跳过`)

  // 验证表创建
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
  if (tables.length > 0) {
    const tableNames = tables[0].values.map(row => row[0])
    console.log('✅ 表创建成功:', tableNames.join(', '))
  }

  // 验证用户数据
  const users = db.exec('SELECT username, nick FROM pf_user WHERE id = 1')
  if (users.length > 0 && users[0].values.length > 0) {
    const user = users[0].values[0]
    console.log('👤 默认账号:', user[0], '/ 123123')
    console.log('📛 管理员昵称:', user[1])
  }

  // 保存数据库到文件
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)

  console.log('💾 数据库已保存到:', dbPath)

  // 关闭数据库
  db.close()

  console.log('\n🎉 SQLite 数据库初始化完成!')
  console.log('   启动命令: set DB_TYPE=sqlite&& node src/server.js')
}

initDatabase().catch(err => {
  console.error('❌ 初始化失败:', err.message)
  process.exit(1)
})
