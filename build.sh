#!/bin/bash
# 一键构建脚本

set -e

echo "=== 1. 构建前端 ==="
cd go-view
npm install
npm run build
cd ..

echo "=== 2. 安装后端依赖 ==="
cd led
npm install
cd ..

echo "=== 3. 构建 Docker 镜像 ==="
docker build -f Dockerfile.allinone -t goview:latest .

echo "=== 构建完成 ==="
echo "运行: docker run -d -p 80:80 -p 8080:8080 --name goview goview:latest"
