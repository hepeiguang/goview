-- LED SQLite 数据库初始化脚本
-- 使用方法: sqlite3 led.db < init_sqlite.sql

-- 用户表
CREATE TABLE IF NOT EXISTS `pf_user` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT,
  `nick` TEXT,
  `password` TEXT,
  `salt` TEXT,
  `birthday` TEXT,
  `gender` TEXT,
  `email` TEXT,
  `phone` TEXT,
  `state` TEXT,
  `description` TEXT,
  `login_count` INTEGER,
  `previous_visit` TEXT,
  `last_visit` TEXT,
  `del_flag` INTEGER DEFAULT 0,
  `last_visit_ip` TEXT DEFAULT '',
  `depart_no` TEXT,
  `avatar_url` TEXT,
  `source` TEXT,
  `inviteman` TEXT,
  `company_id` TEXT DEFAULT '-1',
  `created_at` TEXT DEFAULT (datetime('now')),
  `created_by` TEXT,
  `updated_at` TEXT DEFAULT (datetime('now')),
  `updated_by` TEXT
);

-- LED 项目表
CREATE TABLE IF NOT EXISTS `Led_Projects` (
  `Id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `ProjectName` TEXT,
  `State` INTEGER NOT NULL DEFAULT 0,
  `CreateTime` TEXT,
  `CreateUserId` INTEGER,
  `IsDelete` INTEGER NOT NULL DEFAULT 0,
  `IndexImage` TEXT,
  `Remarks` TEXT,
  `created_at` TEXT DEFAULT (datetime('now')),
  `updated_at` TEXT DEFAULT (datetime('now'))
);

-- LED 项目数据表
CREATE TABLE IF NOT EXISTS `Led_Projectdatas` (
  `Id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `ProjectId` INTEGER NOT NULL,
  `CreateTime` TEXT,
  `CreateUserId` INTEGER,
  `ContentData` TEXT,
  `created_at` TEXT DEFAULT (datetime('now')),
  `updated_at` TEXT DEFAULT (datetime('now'))
);

-- API 配置表
CREATE TABLE IF NOT EXISTS `api` (
  `id` TEXT PRIMARY KEY,
  `realm` TEXT,
  `name` TEXT,
  `description` TEXT,
  `script` TEXT,
  `use` INTEGER DEFAULT 0,
  `script_type` TEXT,
  `exec_type` TEXT,
  `exec_count` INTEGER DEFAULT 0,
  `remark` TEXT,
  `created_by` TEXT,
  `updated_by` TEXT,
  `created_at` TEXT DEFAULT (datetime('now')),
  `updated_at` TEXT DEFAULT (datetime('now'))
);

-- 插入默认管理员账号 (admin / 123123)
-- 密码 hash: $2a$10$qZA9J6wMpUw2s9BHl0sv9eHHTe2rw2lv5kQ2uq.eJbVR1OKFKEfy.
INSERT OR IGNORE INTO `pf_user` (`id`, `username`, `nick`, `password`, `salt`, `email`, `state`, `del_flag`, `company_id`, `created_at`, `updated_at`)
VALUES (1, 'admin', '管理员', '$2a$10$qZA9J6wMpUw2s9BHl0sv9eHHTe2rw2lv5kQ2uq.eJbVR1OKFKEfy.', '$2a$10$qZA9J6wMpUw2s9BHl0sv9e', '285861181@qq.com', NULL, 0, 'dc3c7050-5486-11ea-b47c-6d1213299572', datetime('now'), datetime('now'));

-- 插入示例 API 配置
INSERT OR IGNORE INTO `api` (`id`, `name`, `description`, `script`, `use`, `script_type`, `exec_count`, `created_at`, `updated_at`)
VALUES ('021ea7a0-d878-11ea-a6ca-35634091a02b', NULL, '查询-分页', 'SELECT COUNT(*) AS total FROM bm_ipinfo WHERE plineno = ''@line@'' AND station=''@station@'';

SELECT * FROM bm_ipinfo WHERE plineno = ''@line@'' AND station=''@station@'' LIMIT @offset@,@rows@;', 1, '0', 64, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO `api` (`id`, `name`, `description`, `script`, `use`, `script_type`, `exec_count`, `created_at`, `updated_at`)
VALUES ('d318279e-c6c0-11ed-a3da-e86a64995474', NULL, '查询-不分页', 'SELECT * FROM bm_ipinfo WHERE plineno = ''@line@'' AND station=''@station@'';', 1, '0', 59, datetime('now'), datetime('now'));
