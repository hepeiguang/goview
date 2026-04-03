# 后端 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
RUN apk add --no-cache tini

# 设置 npm 镜像源（可选）
RUN npm config set registry https://registry.npmmirror.com

# 复制 package.json
COPY package.json ./

# 安装生产依赖
RUN npm install --only=production && \
    npm cache clean --force

# 复制源代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads

# 使用 tini 作为 init 系统
ENTRYPOINT ["/sbin/tini", "--"]

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/system/info || exit 1

# 启动命令（默认生产环境）
CMD ["node", "./src/server.js"]
