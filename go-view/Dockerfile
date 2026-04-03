# 前端 Dockerfile
# 使用多阶段构建优化镜像大小

# 阶段1: 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 设置 npm 镜像源（可选）
RUN npm config set registry https://registry.npmmirror.com

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm && \
    pnpm install

# 复制源代码
COPY . .

# 构建生产版本
RUN pnpm build

# 阶段2: 运行阶段 - Nginx
FROM nginx:alpine

# 复制 nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
