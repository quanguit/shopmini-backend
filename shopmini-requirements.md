# 🛒 ShopMini — Requirement Chi Tiết

> Dự án tự học NestJS từ cơ bản đến nâng cao — marketplace mini với 3 vai trò: customer, seller, admin.

---

## 📋 Mục lục

- [🛒 ShopMini — Requirement Chi Tiết](#-shopmini--requirement-chi-tiết)
  - [📋 Mục lục](#-mục-lục)
  - [1. Tổng quan dự án](#1-tổng-quan-dự-án)
    - [💡 Ý tưởng](#-ý-tưởng)
    - [👥 Vai trò người dùng](#-vai-trò-người-dùng)
    - [🧰 Tech Stack](#-tech-stack)
  - [2. Mô hình dữ liệu (Entity chính)](#2-mô-hình-dữ-liệu-entity-chính)
  - [3. Giai đoạn 1 — Nền tảng (Core CRUD \& Module cơ bản)](#3-giai-đoạn-1--nền-tảng-core-crud--module-cơ-bản)
    - [🎯 Mục tiêu học tập](#-mục-tiêu-học-tập)
    - [✅ Yêu cầu chức năng](#-yêu-cầu-chức-năng)
    - [⚙️ Yêu cầu kỹ thuật](#️-yêu-cầu-kỹ-thuật)
    - [🌐 API Endpoints](#-api-endpoints)
  - [4. Giai đoạn 2 — Dữ liệu quan hệ \& Xác thực](#4-giai-đoạn-2--dữ-liệu-quan-hệ--xác-thực)
    - [🎯 Mục tiêu học tập](#-mục-tiêu-học-tập-1)
    - [✅ Yêu cầu chức năng](#-yêu-cầu-chức-năng-1)
    - [⚙️ Yêu cầu kỹ thuật](#️-yêu-cầu-kỹ-thuật-1)
    - [🌐 API Endpoints](#-api-endpoints-1)
  - [5. Giai đoạn 3 — Kiến trúc nâng cao (CQRS + Event + Microservice)](#5-giai-đoạn-3--kiến-trúc-nâng-cao-cqrs--event--microservice)
    - [🎯 Mục tiêu học tập](#-mục-tiêu-học-tập-2)
    - [✅ Yêu cầu chức năng](#-yêu-cầu-chức-năng-2)
    - [⚙️ Yêu cầu kỹ thuật](#️-yêu-cầu-kỹ-thuật-2)
  - [6. Giai đoạn 4 — Đa giao thức (GraphQL + WebSocket)](#6-giai-đoạn-4--đa-giao-thức-graphql--websocket)
    - [🎯 Mục tiêu học tập](#-mục-tiêu-học-tập-3)
    - [✅ Yêu cầu chức năng](#-yêu-cầu-chức-năng-3)
    - [⚙️ Yêu cầu kỹ thuật](#️-yêu-cầu-kỹ-thuật-3)
  - [7. Giai đoạn 5 — Testing, Hiệu năng \& Vận hành](#7-giai-đoạn-5--testing-hiệu-năng--vận-hành)
    - [🎯 Mục tiêu học tập](#-mục-tiêu-học-tập-4)
    - [✅ Yêu cầu chức năng](#-yêu-cầu-chức-năng-4)
  - [8. Giai đoạn 6 — Triển khai sản phẩm thực tế](#8-giai-đoạn-6--triển-khai-sản-phẩm-thực-tế)
    - [🎯 Mục tiêu học tập](#-mục-tiêu-học-tập-5)
    - [✅ Yêu cầu chức năng](#-yêu-cầu-chức-năng-5)
  - [9. Thứ tự triển khai gợi ý](#9-thứ-tự-triển-khai-gợi-ý)

---

## 1. Tổng quan dự án

### 💡 Ý tưởng

Một nền tảng marketplace mini, nơi seller đăng bán sản phẩm, customer mua hàng, admin quản lý toàn hệ thống. Đủ phức tạp để áp dụng toàn bộ kiến thức NestJS từ core đến kiến trúc nâng cao, nhưng đủ nhỏ để một người làm trong vài tuần.

### 👥 Vai trò người dùng

| Vai trò    | Mô tả                                                       |
| ---------- | ----------------------------------------------------------- |
| `customer` | Duyệt sản phẩm, mua hàng, theo dõi đơn, đánh giá            |
| `seller`   | Đăng/sửa sản phẩm của mình, xem đơn hàng liên quan đến shop |
| `admin`    | Quản lý toàn bộ user, sản phẩm, đơn hàng                    |

### 🧰 Tech Stack

| Layer         | Công nghệ                         |
| ------------- | --------------------------------- |
| Backend       | NestJS (TypeScript)               |
| Database      | PostgreSQL + TypeORM              |
| Cache / Queue | Redis + BullMQ                    |
| Auth          | Passport + JWT (access + refresh) |
| Authorization | CASL (policy-based)               |
| API           | REST (chính) + GraphQL (tìm kiếm) |
| Realtime      | WebSocket Gateway (Socket.io)     |
| Microservice  | Redis hoặc NATS transporter       |
| Testing       | Jest (unit + e2e)                 |
| Container     | Docker + docker-compose           |
| Docs          | Swagger (OpenAPI)                 |

---

## 2. Mô hình dữ liệu (Entity chính)

| Entity         | Trường chính                                                                                  | Quan hệ                                                  |
| -------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `User`         | `id`, `email`, `password`, `fullName`, `role`                                                 | 1—N: Product (seller), Order, Cart, Review, Notification |
| `Category`     | `id`, `name`, `slug`, `parent`(self-ref, nullable)                                            | 1—N: Product                                             |
| `Product`      | `id`, `sellerId`, `categoryId`, `name`, `description`, `price`, `stock`, `images[]`, `status` | N—1: User, Category, (1-N): CartItem, OrderItem, Review  |
| `Cart`         | `id`, `userId`                                                                                | 1—N: CartItem, User(N-1)                                 |
| `CartItem`     | `id`, `cartId`, `productId`, `quantity`                                                       | N—1: Cart, Product                                       |
| `Order`        | `id`, `userId`, `status`, `totalAmount`,                                                      | 1—N: OrderItem, Payment(1—1), User(N-1)                  |
| `OrderItem`    | `id`, `orderId`, `productId`, `quantity`, `priceAtOrder`                                      | N—1: Order, Product                                      |
| `Payment`      | `id`, `orderId`, `method`, `status`, `transactionRef`, `paidAt`                               | 1—1: Order                                               |
| `Review`       | `id`, `productId`, `userId`, `rating` (1–5), `comment`,                                       | N—1: Product, User                                       |
| `Notification` | `id`, `userId`, `type`, `payload` (json), `readAt`                                            | N—1: User                                                |

> **Ghi chú:**
>
> - `User.role` ∈ `{customer, seller, admin}`
> - `Product.status` ∈ `{draft, published}`
> - `Order.status` ∈ `{pending, confirmed, shipping, delivered, cancelled}`
> - `Payment.status` ∈ `{pending, success, failed}`

---

## 3. Giai đoạn 1 — Nền tảng (Core CRUD & Module cơ bản)

### 🎯 Mục tiêu học tập

Thành thạo **Module / Controller / Service**, DI scope, custom decorator, exception filter, pipe validate.

### ✅ Yêu cầu chức năng

| ID    | Mô tả                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------- |
| FR1.1 | Đăng ký / lấy thông tin user cơ bản (chưa cần auth thật, có thể seed sẵn user)                       |
| FR1.2 | CRUD Category — chỉ **admin** được tạo / sửa / xoá                                                   |
| FR1.3 | CRUD Product — **seller** tạo, sửa, xoá **chỉ trên sản phẩm của chính mình**                         |
| FR1.4 | Validate toàn bộ input bằng DTO (`class-validator`), reject field không khai báo (`whitelist: true`) |
| FR1.5 | Exception filter trả response lỗi đồng nhất: `{ statusCode, message, error, timestamp }`             |

### ⚙️ Yêu cầu kỹ thuật

- Custom decorator `@CurrentUser()` — lấy user từ request (tạm mock qua header `x-user-id`)
- Guard `OwnershipGuard` — seller chỉ sửa được product của chính mình
- Custom pipe — parse & validate `productId` dạng UUID

### 🌐 API Endpoints

| Method   | Endpoint        | Quyền          | Mô tả                                    |
| -------- | --------------- | -------------- | ---------------------------------------- |
| `POST`   | `/categories`   | admin          | Tạo category                             |
| `GET`    | `/categories`   | public         | Danh sách category                       |
| `POST`   | `/products`     | seller         | Tạo product                              |
| `GET`    | `/products`     | public         | Danh sách product (filter theo category) |
| `GET`    | `/products/:id` | public         | Chi tiết product                         |
| `PATCH`  | `/products/:id` | seller (owner) | Sửa product                              |
| `DELETE` | `/products/:id` | seller (owner) | Xoá product                              |

> ### 🏁 Definition of Done
>
> CRUD chạy đúng, validate input chặt chẽ. **Seller A không thể sửa product của seller B** — test bằng Postman với 2 user khác nhau.

---

## 4. Giai đoạn 2 — Dữ liệu quan hệ & Xác thực

### 🎯 Mục tiêu học tập

Transaction, quan hệ phức tạp, JWT auth thật, RBAC / CASL.

### ✅ Yêu cầu chức năng

| ID    | Mô tả                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| FR2.1 | Đăng ký / đăng nhập thật với email + password (hash bằng bcrypt)                                                               |
| FR2.2 | JWT access token (15 phút) + refresh token (7 ngày), endpoint refresh token                                                    |
| FR2.3 | Thêm sản phẩm vào Cart, sửa số lượng, xoá khỏi cart                                                                            |
| FR2.4 | **Checkout:** tạo Order từ Cart, trừ stock, tạo OrderItem — toàn bộ trong **một transaction** (hết hàng giữa chừng → rollback) |
| FR2.5 | Phân quyền CASL: customer chỉ xem order của mình, seller chỉ xem order chứa SP của mình, admin xem tất cả                      |

### ⚙️ Yêu cầu kỹ thuật

- `AuthGuard` + `RolesGuard` kết hợp CASL ability factory
- Transaction qua `QueryRunner` (TypeORM) hoặc `$transaction` (Prisma)
- Chống race condition khi 2 người cùng mua sản phẩm cuối cùng:
  - Pessimistic lock: `SELECT ... FOR UPDATE`
  - Hoặc Optimistic lock (version column)

### 🌐 API Endpoints

| Method   | Endpoint           | Quyền                            | Mô tả                                 |
| -------- | ------------------ | -------------------------------- | ------------------------------------- |
| `POST`   | `/auth/register`   | public                           | Đăng ký                               |
| `POST`   | `/auth/login`      | public                           | Đăng nhập, trả access + refresh token |
| `POST`   | `/auth/refresh`    | public (cần refresh token)       | Lấy access token mới                  |
| `GET`    | `/cart`            | customer                         | Xem cart hiện tại                     |
| `POST`   | `/cart/items`      | customer                         | Thêm sản phẩm vào cart                |
| `PATCH`  | `/cart/items/:id`  | customer                         | Sửa số lượng                          |
| `DELETE` | `/cart/items/:id`  | customer                         | Xoá khỏi cart                         |
| `POST`   | `/orders/checkout` | customer                         | Tạo order từ cart                     |
| `GET`    | `/orders`          | customer / seller / admin (CASL) | Danh sách order                       |
| `GET`    | `/orders/:id`      | customer / seller / admin (CASL) | Chi tiết order                        |

> ### 🏁 Definition of Done
>
> Checkout đồng thời từ 2 tab khi stock chỉ còn **1 sản phẩm** → chỉ **một** order thành công, order còn lại trả lỗi rõ ràng: `"hết hàng"`.

---

## 5. Giai đoạn 3 — Kiến trúc nâng cao (CQRS + Event + Microservice)

### 🎯 Mục tiêu học tập

Tách command/query, event-driven, microservice giao tiếp qua message broker.

### ✅ Yêu cầu chức năng

| ID    | Mô tả                                                                                       |
| ----- | ------------------------------------------------------------------------------------------- |
| FR3.1 | Tách flow checkout thành Command (`CreateOrderCommand`) xử lý qua `@nestjs/cqrs`            |
| FR3.2 | Bắn event `OrderCreatedEvent` sau khi order tạo thành công                                  |
| FR3.3 | Tách **Notification** thành microservice riêng, lắng nghe event qua Redis pub/sub hoặc NATS |
| FR3.4 | Notification service tạo bản ghi `Notification` và (giả lập) gửi email xác nhận đơn hàng    |

### ⚙️ Yêu cầu kỹ thuật

- Hai app NestJS trong cùng monorepo:
  - `apps/api` — HTTP server
  - `apps/notification` — microservice (hybrid hoặc pure)
- API gửi message qua `ClientProxy`, Notification nhận qua `@MessagePattern` / `@EventPattern`
- **Resilience:** Notification service down → order vẫn tạo thành công, notification bị lùi lại (không block flow chính)

```
┌──────────┐     Event      ┌──────────────────┐
│  API     │ ──────────────> │  Notification    │
│ (HTTP)   │                 │  (Microservice)  │
└──────────┘                 └──────────────────┘
     │                              │
     ▼                              ▼
  PostgreSQL                    PostgreSQL
```

> ### 🏁 Definition of Done
>
> Tắt Notification service → checkout vẫn thành công bình thường. Khi bật lại, các order đã tạo trong lúc tắt **không bị mất** nếu dùng queue có retry/persist (BullMQ hoặc Redis Streams).

---

## 6. Giai đoạn 4 — Đa giao thức (GraphQL + WebSocket)

### 🎯 Mục tiêu học tập

Thiết kế API ngoài REST, giao tiếp realtime hai chiều.

### ✅ Yêu cầu chức năng

| ID    | Mô tả                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| FR4.1 | GraphQL endpoint tìm kiếm sản phẩm: filter (category, khoảng giá, từ khoá), sort, pagination dạng **cursor** |
| FR4.2 | WebSocket Gateway `/orders` — customer nhận update realtime khi trạng thái order thay đổi                    |
| FR4.3 | Seller đẩy cập nhật trạng thái order qua WebSocket → lan đến đúng customer đang theo dõi order đó            |

### ⚙️ Yêu cầu kỹ thuật

- **Code-first GraphQL:** `@ObjectType()`, `@Field()`, `@Resolver()` → tự sinh schema
- **DataLoader** — tránh N+1 khi GraphQL resolve `seller` hoặc `category` lồng trong Product
- **WebSocket room** theo `orderId` hoặc `userId` → chỉ broadcast đến đúng client liên quan

> ### 🏁 Definition of Done
>
> Mở 2 tab browser (1 customer, 1 admin). Admin đổi trạng thái order → tab customer nhận update **tức thì**, không cần F5.

---

## 7. Giai đoạn 5 — Testing, Hiệu năng & Vận hành

### 🎯 Mục tiêu học tập

Đảm bảo chất lượng và khả năng chịu tải ở mức cơ bản.

### ✅ Yêu cầu chức năng

| ID    | Mô tả                                                                                 |
| ----- | ------------------------------------------------------------------------------------- |
| FR5.1 | Unit test `OrderService` (mock repository) — gồm test case hết hàng & race condition  |
| FR5.2 | E2e test toàn bộ flow: register → login → add to cart → checkout → xem order          |
| FR5.3 | Cache danh sách product "bán chạy" / "mới nhất" bằng Redis, auto-invalidate           |
| FR5.4 | Job nền (BullMQ) gửi email + xuất báo cáo doanh thu hàng ngày qua `@nestjs/schedule`  |
| FR5.5 | Health check endpoint `/health` — kiểm tra DB, Redis, Notification service (Terminus) |

> ### 🏁 Definition of Done
>
> Test coverage module Order **≥ 80%**. `/health` trả `503` đúng khi cố tình tắt Redis.

---

## 8. Giai đoạn 6 — Triển khai sản phẩm thực tế

### 🎯 Mục tiêu học tập

Đưa hệ thống chạy được như một sản phẩm thật.

### ✅ Yêu cầu chức năng

| ID    | Mô tả                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------- |
| FR6.1 | Dockerfile cho từng app (`api`, `notification`), docker-compose: Postgres, Redis, api, notification |
| FR6.2 | `ConfigModule` validate biến môi trường bằng **Joi** — app không start nếu thiếu biến bắt buộc      |
| FR6.3 | Swagger UI đầy đủ cho REST API, có ví dụ request/response                                           |
| FR6.4 | Deploy thật lên VPS hoặc nền tảng như Railway / Render, có domain truy cập được                     |

> ### 🏁 Definition of Done
>
> Chạy `docker-compose up` từ máy sạch (chưa cài gì ngoài Docker) → hệ thống chạy hoàn chỉnh. Người khác có thể truy cập Swagger qua URL public và test thử API.

---

## 9. Thứ tự triển khai gợi ý

| #   | Công việc                                             | Giai đoạn |
| --- | ----------------------------------------------------- | :-------: |
| 1   | Setup project, entity, migration ban đầu              |     1     |
| 2   | CRUD Category/Product + validate + ownership guard    |     1     |
| 3   | Auth JWT + Cart + Checkout có transaction             |     2     |
| 4   | RBAC/CASL cho toàn bộ endpoint order                  |     2     |
| 5   | Tách CQRS cho Order, bắn event                        |     3     |
| 6   | Tách Notification service, kết nối qua message broker |     3     |
| 7   | GraphQL search product                                |     4     |
| 8   | WebSocket realtime order status                       |     4     |
| 9   | Viết test, thêm cache + queue + health check          |     5     |
| 10  | Dockerize + deploy thật                               |     6     |

> ⚠️ **Quan trọng:** Làm đúng thứ tự này để mỗi bước đều build trên một hệ thống đã chạy được. Tránh việc cố làm phần nâng cao khi phần nền tảng còn chưa ổn định.

---

<div align="center">

> **Happy Coding! 🚀**

</div>
