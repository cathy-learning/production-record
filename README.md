# 生产记录系统（V1）

## 功能
- 历史记录控制台：搜索、编辑、硬删除、生成 PDF
- 数据录入表单：A/B/D/E 分区，全部字段非必填
- 后端持久化：SQLite 单文件数据库
- PDF 导出：`@react-pdf/renderer` 生成标准记录单

## 本地启动
### 1) 后端
```bash
cd app/backend
npm install
npm start
```

### 2) 前端
```bash
cd app/frontend
npm install
npm run dev
```

默认访问：
- 前端：`http://localhost:3000`
- 后端：`http://localhost:3001`

## Docker 一键启动
```bash
docker compose up --build
```

## 数据库文件
- 默认文件：`app/backend/data/production.db`
- Docker 模式：映射到宿主机 `./data/production.db`

## 删除策略
- 当前为**硬删除**：删除后不可恢复。
