# GoView Docker 部署说明

## 项目结构

```
go-view/
├── go-view/              # 前端项目 (Vue 3 + Vite)
│   ├── Dockerfile
│   └── nginx.conf
├── led/                  # 后端项目 (Node.js + Express)
│   ├── Dockerfile
│   └── .env.example
├── Dockerfile.allinone   # 一体化部署（前后端合一）
├── docker-compose.yml              # 开发环境配置 (SQLite)
├── docker-compose.prod.yml         # 生产环境配置 (MySQL)
├── docker-compose.allinone.yml     # 一体化部署配置 (SQLite)
├── docker-compose.allinone.prod.yml # 一体化生产配置 (MySQL)
└── README-docker.md               # 本文件
```

## 快速开始

### 方式一：一体化部署（推荐）

前后端服务打包在单个容器中，占用资源少，部署简单。

```bash
# 开发环境（SQLite）
docker-compose -f docker-compose.allinone.yml up -d --build

# 生产环境（MySQL）
docker-compose -f docker-compose.allinone.prod.yml up -d --build

# 停止服务
docker-compose -f docker-compose.allinone.yml down
```

### 方式二：分离部署

前端和后端分别在不同容器中运行，便于独立扩展。

```bash
# 开发环境
docker-compose up -d --build

# 生产环境
docker-compose -f docker-compose.prod.yml up -d --build
```

## 构建优化

### 多阶段构建

Dockerfile.allinone 使用多阶段构建优化镜像大小：

- **builder 阶段**：安装构建工具（python3、make、g++），执行 npm install 和构建
- **runner 阶段**：仅复制最终产物，不包含构建工具

### 复用构建缓存

首次构建后，builder 镜像会被缓存，后续构建会复用：

```bash
# 第一次构建（生成 builder 镜像）
docker build --target builder -t go-view-builder:latest -f Dockerfile.allinone .

# 之后构建（自动复用 builder 缓存）
docker build -t go-view:allinone -f Dockerfile.allinone .
```

### 镜像体积对比

| 部署方式 | 典型镜像大小 | 说明 |
|---------|-------------|------|
| 一体化（优化后） | ~300MB | 仅包含运行时 |
| 分离部署 | ~500MB+ | 前后端各自镜像 |

## 环境变量

### 一体化部署

```bash
# 创建 .env 文件
cat > .env << EOF
NODE_ENV=production
PORT=8080
DB_TYPE=sqlite
DB_PATH=/app/backend/db/goview.db
JWT_SECRET=your-secret-key-change-in-production
EOF
```

### 后端环境变量（分离部署）

- `MYSQL_ROOT_PASSWORD` - MySQL root 密码
- `MYSQL_PASSWORD` - GoView 数据库用户密码
- `JWT_SECRET` - JWT 签名密钥（生产环境务必修改）

## 端口说明

| 服务   | 端口 | 说明           |
|--------|------|----------------|
| 前端   | 80   | Web 服务       |
| 后端   | 8080 | API 服务       |
| MySQL  | 3306 | 数据库（生产） |

## 数据持久化

### 一体化部署

| Volume        | 容器路径              | 说明           |
|---------------|---------------------|----------------|
| goview-data   | /app/backend/db     | 数据库文件     |
| goview-uploads | /app/backend/uploads | 上传文件       |
| goview-logs   | /app/logs           | 日志文件       |

### 分离部署

- `backend-data` - SQLite 数据库文件
- `backend-uploads` - 上传的文件
- `mysql-data` - MySQL 数据库文件

## 常用命令

```bash
# ========== 一体化部署命令 ==========

# 查看日志
docker-compose -f docker-compose.allinone.yml logs -f

# 进入容器
docker exec -it goview-allinone sh

# 重新构建
docker-compose -f docker-compose.allinone.yml up -d --build

# 强制重新构建（不使用缓存）
docker build --no-cache -t go-view:allinone -f Dockerfile.allinone .

# 清理未使用的镜像
docker image prune -f

# ========== 分离部署命令 ==========

# 进入后端容器
docker exec -it goview-backend sh

# 进入数据库
docker exec -it goview-mysql mysql -u goview -p goview

# 查看容器状态
docker-compose ps

# 重启服务
docker-compose restart backend
```

## 生产部署注意事项

1. **修改 JWT 密钥**
   ```bash
   export JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **配置 HTTPS**（使用 Nginx 反向代理）

3. **定期备份数据库**
   ```bash
   # 一体化部署备份
   docker exec goview-allinone sh -c 'cp /app/backend/db/goview.db /app/backend/uploads/backup.sqlite'
   docker cp goview-allinone:/app/backend/uploads/backup.sqlite ./backup.sqlite

   # 分离部署备份
   docker exec goview-mysql mysqldump -u root -p goview > backup.sql
   ```

4. **监控资源使用**
   ```bash
   docker stats
   ```

5. **健康检查**
   ```bash
   # 检查容器健康状态
   docker inspect --format='{{.State.Health.Status}}' goview-allinone

   # 测试 API
   curl http://localhost:8080/api/system/info
   ```
