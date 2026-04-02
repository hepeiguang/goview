# LED 后端 SQLite 存储方案改造文档

## 一、现状分析

### 1.1 当前架构

```
led/
├── src/
│   ├── config/
│   │   └── env/
│   │       ├── default.js      # MySQL 配置 (默认)
│   │       ├── dev.js          # 开发环境
│   │       ├── test.js         # SQL Server 配置
│   │       └── prod.js         # 生产环境
│   ├── models/
│   │   ├── index.js            # 模型加载入口
│   │   ├── self/               # 业务模型
│   │   └── pf/                 # 公共模型
│   ├── utils/
│   │   └── db_utils/
│   │       └── db.js           # 数据库工具类 (已支持 SQLite)
│   └── server.js               # 服务入口
└── db/
    ├── mysql.sql                # MySQL 初始化脚本
    ├── sqlserver.sql            # SQL Server 脚本
    └── init_sqlite.sql          # SQLite 初始化脚本 (已存在)
```

### 1.2 数据库支持情况

| 数据库 | 驱动 | 配置文件 | 状态 |
|--------|------|----------|------|
| MySQL | mysql2 | default.js | ✅ 已启用 |
| SQL Server | tedious | test.js | ✅ 已配置 |
| SQLite | sqlite3 | **需新增** | ⚠️ 已具备基础支持 |

### 1.3 现有 SQLite 支持分析

**db.js 已有的 SQLite 支持**:
```javascript
case 'sqlite':
  knex_options.client = 'sqlite3'
  knex_options.connection = { filename: db_cfg.connect.storage }
  break
```

**已存在的 init_sqlite.sql**:
- 包含 4 张表的创建语句
- 包含默认管理员账号
- 包含示例 API 配置

---

## 二、改造方案

### 方案一：环境变量切换 (推荐)

**原理**: 通过 `NODE_ENV` 环境变量切换不同的配置文件，实现零代码改动切换数据库。

#### 2.1.1 创建 SQLite 配置文件

**文件**: `src/config/env/sqlite.js`

```javascript
'use strict'

const path = require('path')
const APP_ROOT = process.cwd()

const config = {
  sequelizeConfig: {
    username: '',                    // SQLite 不需要用户名
    password: '',                    // SQLite 不需要密码
    database: 'led',                 // 数据库名
    connect: {
      dialect: 'sqlite',             // 指定 SQLite 方言
      storage: path.join(APP_ROOT, 'db/led.sqlite'),  // SQLite 文件路径
      timezone: '+08:00',
      define: {
        charset: 'utf8mb4',
        freezeTableName: true,        // 不自动添加表名后缀
        timestamps: true,              // 启用时间戳
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      // SQLite 无连接池，设置 pool 为 false
      pool: {
        max: 1,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  }
}

module.exports = config
```

#### 2.1.2 更新配置加载逻辑

**文件**: `src/config/index.js`

```javascript
'use strict'

const _ = require('lodash')
const defaults = require('./env/default')
const dev = require('./env/dev')
const test = require('./env/test')
const prod = require('./env/prod')
const sqlite = require('./env/sqlite')  // 新增 SQLite 配置

const APP_CONFIG = {
  dev: _.defaults(dev || {}, defaults),
  test: _.defaults(test || {}, defaults),
  prod: _.defaults(prod || {}, defaults),
  sqlite: _.defaults(sqlite || {}, defaults),  // 新增 SQLite 环境
}[process.env.NODE_ENV || 'dev']

global.config = APP_CONFIG

module.exports = APP_CONFIG
```

#### 2.1.3 更新 package.json 启动脚本

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=dev nodemon ./src/server.js",
    "start": "node ./src/server.js",
    "prod": "cross-env NODE_ENV=prod node ./src/server.js",
    "sqlite": "cross-env NODE_ENV=sqlite node ./src/server.js",  // 新增 SQLite 启动
    "pm2": "pm2 start pm2.json --env production"
  }
}
```

#### 2.1.4 初始化 SQLite 数据库

```bash
# Windows
cd led
mkdir db
sqlite3 db\led.sqlite < db\init_sqlite.sql

# 或使用 Node.js 脚本
node scripts/init-sqlite.js
```

#### 2.1.5 启动命令

```bash
# 使用 SQLite 启动
npm run sqlite

# 或直接指定环境
NODE_ENV=sqlite node src/server.js
```

---

### 方案二：动态数据库选择器

**原理**: 提供命令行参数选择数据库类型，适合需要灵活切换的场景。

#### 2.2.1 创建数据库配置工厂

**文件**: `src/config/databaseFactory.js`

```javascript
'use strict'

const path = require('path')
const APP_ROOT = process.cwd()

const DB_TYPE = process.env.DB_TYPE || 'mysql'

const configs = {
  mysql: {
    username: 'root',
    password: '123456',
    database: 'led',
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306
  },
  sqlite: {
    username: '',
    password: '',
    database: 'led',
    dialect: 'sqlite',
    storage: path.join(APP_ROOT, 'db/led.sqlite')
  },
  mssql: {
    username: 'sa',
    password: 'root',
    database: 'iMES',
    dialect: 'mssql',
    host: '192.168.31.44',
    port: 1433
  }
}

const dbConfig = configs[DB_TYPE] || configs.mysql

console.log(`🎯 使用数据库: ${DB_TYPE}`)

module.exports = {
  DB_TYPE,
  dbConfig
}
```

#### 2.2.2 更新配置文件

**文件**: `src/config/env/default.js`

```javascript
'use strict'

const path = require('path')
const utils = require('./utils')
const _package = require('../../../package.json')
const { dbConfig } = require('./databaseFactory')

const APP_ROOT = process.cwd()
const APP_NAME = 'LED'

let config = {
  APP_ROOT: APP_ROOT,
  APP_NAME: APP_NAME,
  APP_PORT: process.env.PORT || 4444,
  APP_SECRET: Buffer.from(APP_NAME, 'base64'),
  DEBUG: true,
  VERSION: _package.version,
  LOG_DIR: path.join(APP_ROOT, 'logs'),
  UPLOAD_PATH_LED: path.join(APP_ROOT, 'tmp/upload/led/'),
  sessionExpiresIn: '100y',
  SALT_WORK_FACTOR: 10,
  API_RES_TYPE: 'datagrid',

  sequelizeConfig: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    connect: {
      host: dbConfig.host || '127.0.0.1',
      port: dbConfig.port || 3306,
      dialect: dbConfig.dialect,
      dialectOptions: dbConfig.dialect === 'mysql' ? {
        dateStrings: true,
        typeCast: true,
        multipleStatements: true,
        charset: 'utf8mb4',
        supportBigNumbers: true,
        bigNumberStrings: true,
        decimalNumbers: true
      } : dbConfig.dialect === 'mssql' ? {
        options: {
          encrypt: false,
          trustServerCertificate: true
        },
        useUTC: true
      } : {},
      timezone: '+08:00',
      storage: dbConfig.storage,  // SQLite 专用
      define: {
        charset: 'utf8mb4',
        freezeTableName: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      hooks: {},
      pool: dbConfig.dialect === 'sqlite' ? {
        max: 1,
        min: 0,
        acquire: 30000,
        idle: 10000
      } : {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  }
}

module.exports = config
```

#### 2.2.3 启动命令

```bash
# MySQL (默认)
node src/server.js

# SQLite
DB_TYPE=sqlite node src/server.js

# SQL Server
DB_TYPE=mssql node src/server.js
```

---

### 方案三：配置文件模式 (最简单)

**原理**: 修改 `default.js` 支持通过环境变量切换存储类型，零新增文件。

#### 2.3.1 修改 default.js

```javascript
'use strict'

const path = require('path')
const utils = require('./utils')
const _package = require('../../../package.json')

const APP_ROOT = process.cwd()
const APP_NAME = 'LED'

// 支持环境变量切换数据库类型
const DB_TYPE = process.env.DB_TYPE || 'mysql'

// 根据 DB_TYPE 生成配置
const getDbConfig = () => {
  switch (DB_TYPE) {
    case 'sqlite':
      return {
        username: '',
        password: '',
        database: 'led',
        dialect: 'sqlite',
        storage: path.join(APP_ROOT, 'db/led.sqlite'),
        dialectOptions: {},
        pool: { max: 1, min: 0, acquire: 30000, idle: 10000 }
      }
    case 'mssql':
      return {
        username: 'sa',
        password: 'root',
        database: 'iMES',
        dialect: 'mssql',
        host: '192.168.31.44',
        port: 1433,
        dialectOptions: {
          options: {
            encrypt: false,
            trustServerCertificate: true
          },
          useUTC: true
        },
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
      }
    case 'mysql':
    default:
      return {
        username: 'root',
        password: '123456',
        database: 'led',
        dialect: 'mysql',
        host: '127.0.0.1',
        port: 3306,
        dialectOptions: {
          dateStrings: true,
          typeCast: true,
          multipleStatements: true,
          charset: 'utf8mb4',
          supportBigNumbers: true,
          bigNumberStrings: true,
          decimalNumbers: true
        },
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
      }
  }
}

const dbConfig = getDbConfig()
console.log(`🎯 数据库类型: ${DB_TYPE}`)

let config = {
  APP_ROOT: APP_ROOT,
  APP_NAME: APP_NAME,
  APP_PORT: process.env.PORT || 4444,
  APP_SECRET: Buffer.from(APP_NAME, 'base64'),
  DEBUG: true,
  VERSION: _package.version,
  LOG_DIR: path.join(APP_ROOT, 'logs'),
  UPLOAD_PATH_LED: path.join(APP_ROOT, 'tmp/upload/led/'),
  sessionExpiresIn: '100y',
  SALT_WORK_FACTOR: 10,
  API_RES_TYPE: 'datagrid',

  sequelizeConfig: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    connect: {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      dialectOptions: dbConfig.dialectOptions,
      timezone: '+08:00',
      storage: dbConfig.storage,
      define: {
        charset: 'utf8mb4',
        freezeTableName: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      hooks: {},
      pool: dbConfig.pool
    }
  }
}

module.exports = config
```

#### 2.3.2 启动命令

```bash
# MySQL (默认)
node src/server.js

# SQLite
DB_TYPE=sqlite node src/server.js

# SQL Server
DB_TYPE=mssql node src/server.js
```

---

## 三、SQLite 注意事项

### 3.1 SQLite 限制

| 特性 | MySQL | SQLite | 影响 |
|------|-------|--------|------|
| 并发写入 | 支持 | 仅单个写入 | 高并发场景受限 |
| 存储过程 | 支持 | 不支持 | API 脚本需调整 |
| 字符集 | utf8mb4 | UTF-8 | 需确认兼容性 |
| 索引 | 丰富 | 基本支持 | 无影响 |

### 3.2 模型字段映射 (重要)

SQLite 数据库使用大写列名（如 `ProjectName`），需要在模型中添加 `field` 属性映射：

```javascript
// Led_Projects.js
Led_Projects.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, field: 'Id' },
    projectName: { type: DataTypes.TEXT, field: 'ProjectName' },
    state: { type: DataTypes.INTEGER, field: 'State' },
    // ...
  },
  {
    modelName: 'Led_Projects',
    tableName: 'Led_Projects',
    timestamps: false
  }
)
```

### 3.3 中文支持

确保 SQLite 文件以 UTF-8 编码存储。Node.js 默认使用 UTF-8，无需额外配置。

---

## 四、初始化脚本

### 4.1 init_sqlite.sql (已有)

```sql
-- LED SQLite 数据库初始化脚本
CREATE TABLE IF NOT EXISTS `pf_user` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT,
  `nick` TEXT,
  `password` TEXT,
  -- ...
);

CREATE TABLE IF NOT EXISTS `Led_Projects` (
  `Id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `ProjectName` TEXT,
  -- ...
);

-- 默认管理员账号
INSERT OR IGNORE INTO `pf_user` VALUES (1, 'admin', '管理员', 'hash...');
```

### 4.2 初始化脚本

**scripts/init-sqlite.js**

```javascript
const sqlite3 = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../db/led.sqlite')
const sqlPath = path.join(__dirname, '../db/init_sqlite.sql')

// 确保 db 目录存在
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// 删除旧数据库
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
  console.log('🗑️  已删除旧数据库')
}

// 创建新数据库
const db = sqlite3(dbPath)
db.pragma('journal_mode = WAL')

// 执行初始化脚本
const sql = fs.readFileSync(sqlPath, 'utf8')
db.exec(sql)

console.log('✅ SQLite 数据库初始化完成')
console.log(`📁 数据库路径: ${dbPath}`)
console.log('👤 默认账号: admin / 123123')

db.close()
```

---

## 五、方案对比

| 方案 | 改动量 | 复杂度 | 灵活性 | 推荐场景 |
|------|--------|--------|--------|----------|
| 方案一：环境变量切换 | 中 (新增 1 文件) | 低 | 中 | 固定环境切换 |
| 方案二：动态数据库选择器 | 大 (重构配置) | 中 | 高 | 需要动态切换 |
| **方案三：配置文件模式** | **小 (仅修改 1 文件)** | **低** | **中** | **快速实施** |

---

## 六、推荐实施步骤

### 步骤 1: 修改配置文件

采用**方案三**，直接修改 `src/config/env/default.js`

### 步骤 2: 初始化 SQLite 数据库

```bash
cd led
node scripts/init-sqlite.js
```

### 步骤 3: 测试启动

```bash
DB_TYPE=sqlite node src/server.js
```

### 步骤 4: 验证功能

```bash
# 测试登录
curl http://127.0.0.1:4444/api/goview/sys/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123123"}'

# 测试项目列表
curl "http://127.0.0.1:4444/api/goview/project/list?page=1&limit=10"
```

---

## 七、附录

### A. 完整修改后的 default.js

见上方方案三代码

### B. 启动脚本别名

在 `package.json` 中添加：

```json
{
  "scripts": {
    "start:mysql": "node src/server.js",
    "start:sqlite": "cross-env DB_TYPE=sqlite node src/server.js",
    "start:mssql": "cross-env DB_TYPE=mssql node src/server.js"
  }
}
```

### C. Docker 支持 (可选)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 4444
CMD ["sh", "-c", "node scripts/init-sqlite.js && node src/server.js"]
```
