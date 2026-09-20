# Restaurant SaaS starter

This repository is a minimal monorepo starter for a multi-tenant restaurant SaaS based on the architecture discussed in the design brief.

## Stack

- Backend: NestJS + TypeScript
- Frontend: React + Vite + TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Monorepo: npm workspaces

## Structure

- `apps/api`: NestJS API and Prisma schema
- `apps/web`: React frontend shell

## Quick start

1. Install dependencies:
   npm install
2. Prepare environment:
   copy `apps/api/.env.example` to `apps/api/.env`
3. Run the app:
   npm run dev

## Database and production checks

Start PostgreSQL locally with Docker Desktop. The compose database uses host port `55432` so it does not conflict with an installed PostgreSQL service on port `5432`:

   docker compose up -d db

Apply the Prisma migration and seed data:

   npm run prisma:migrate --workspace apps/api
   npm run seed --workspace apps/api

Before production, set a strong `JWT_SECRET`, a restricted `CORS_ORIGIN`, and
`NODE_ENV=production` in `apps/api/.env`. The API health check is available at
`GET /health`.

## Production container deployment

Copy `.env.production.example` to `.env.prod` at the repository root and replace
all placeholder secrets and the public origin. The file is ignored by git and
is loaded automatically by `docker-compose.prod.yml`. Then build and start the
production stack:

   docker compose -f docker-compose.prod.yml up -d --build

The web container serves the application on `WEB_PORT` and proxies `/api` and
`/health` to the API. The API waits for a healthy PostgreSQL container and runs
`prisma migrate deploy` before starting. Seed data is intentionally not run in
production; create the first tenant through the registration flow or run the
seed command only in a controlled environment.

Check the deployment with:

   curl http://localhost:8080/health

## Notes

This starter focuses on the SaaS architecture foundation: tenant isolation, auth, branch handling, and starter API contracts. It is intentionally small and production-ready enough to be extended.



## Quy trình làm việc dành cho Developer

### 1. Trước khi bắt đầu task mới

Luôn lấy code mới nhất từ `main`:

```bash
git checkout main
git pull origin main
```

### 2. Tạo branch mới cho task

Không code trực tiếp trên `main`.

Thêm chức năng:

```bash
git checkout -b feature/<ten-task>
```

Sửa lỗi:

```bash
git checkout -b fix/<ten-task>
```

Ví dụ:

```bash
git checkout -b feature/order-realtime
```

### 3. Code và commit

Sau khi hoàn thành một phần công việc:

```bash
git status
git add .
git commit -m "feat: add realtime order updates"
```

Quy ước commit:

```text
feat:      thêm chức năng
fix:       sửa lỗi
refactor:  cải tổ code
perf:      tối ưu hiệu năng
docs:      cập nhật tài liệu
chore:     thay đổi kỹ thuật khác
```

### 4. Push branch lên GitHub

Lần đầu:

```bash
git push -u origin feature/order-realtime
```

Các lần tiếp theo:

```bash
git push
```

### 5. Hoàn thành task → tạo Pull Request

Trên GitHub tạo Pull Request:

```text
feature/<ten-task> → main
```

Trong PR ghi rõ:

- Đã làm/thay đổi những gì.
- Cách kiểm tra.
- Có thay đổi database/migration không.
- Có thêm biến môi trường/config mới không.

Sau đó chờ review.

### 6. Nếu được yêu cầu sửa

Tiếp tục sửa trên chính branch hiện tại:

```bash
git add .
git commit -m "fix: address review feedback"
git push
```

Pull Request sẽ tự cập nhật.

Không cần tạo PR mới.

### 7. Sau khi PR đã được merge

Cập nhật lại `main`:

```bash
git checkout main
git pull origin main
```

Xóa branch cũ:

```bash
git branch -d feature/order-realtime
```

Sau đó task tiếp theo lại tạo branch mới từ `main`.

## Quy tắc bắt buộc

- Không code trực tiếp trên `main`.
- Không push trực tiếp lên `main`.
- Không tự merge Pull Request.
- Mỗi task sử dụng một branch riêng.
- Không commit `.env`, password, API key hoặc secret.
- Không `git push --force`.
- Không sửa/xóa Prisma migration đã chạy.
- Trước khi tạo branch mới phải `pull` `main` mới nhất.
- Code phải build/test được trước khi tạo Pull Request.
