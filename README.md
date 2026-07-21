# BURAPACONCRETE CPAC Booking

ระบบรับจองและบริหารจัดการคิวส่งคอนกรีตผสมเสร็จ (Ready-Mix Concrete Booking) สำหรับ BURAPACONCRETE
สร้างด้วย React (Vite) + TypeScript + Tailwind CSS ในสไตล์ Warm-Minimalist พร้อมระบบฐานข้อมูลบน
Cloudflare D1 ผ่าน Cloudflare Worker (โพลข้อมูลทุก 15 นาที) และรองรับ LocalStorage
Fallback อัตโนมัติเมื่อไม่ได้เชื่อมต่อคลาวด์ (เช่นตอน `npm run dev` บนเครื่อง)

## Getting started

```bash
npm install
npm run dev
```

บัญชีทดลองใช้งาน:

| Role  | Username | Password  |
| ----- | -------- | --------- |
| Admin | `admin`  | `admin123`|
| Staff | `staff`  | `staff123`|

## Cloudflare D1 setup

ระบบทำงานได้ทันทีในโหมด LocalStorage โดยไม่ต้องตั้งค่าใดๆ (ใช้ตอน `npm run dev` เพราะไม่มี Worker
ให้เรียก) เมื่อ deploy ขึ้น Cloudflare Workers พร้อมผูก D1 database แล้ว แอปจะตรวจจับ `/api/bookings`
ได้อัตโนมัติและสลับไปโหมด Cloudflare D1 ทันที (แสดงสถานะที่ Mini Utility Bar)

ขั้นตอนตั้งค่า D1 (ทำครั้งเดียว):

```bash
# 1. สร้างฐานข้อมูล D1
npx wrangler d1 create cpac_booking_db
# คัดลอกค่า database_id ที่ได้ไปใส่ใน wrangler.toml (แทน REPLACE_WITH_YOUR_D1_DATABASE_ID)

# 2. รัน schema เพื่อสร้างตาราง
npx wrangler d1 execute cpac_booking_db --remote --file=./schema.sql
```

Deploy ด้วยตนเองได้ผ่าน `npm run deploy` (รัน `vite build` แล้วตามด้วย `wrangler deploy`) หรือให้
Cloudflare Workers Builds (Git integration) จัดการให้อัตโนมัติทุกครั้งที่ push — ตรวจสอบใน Settings
ของโปรเจกต์ว่า Build command ตั้งเป็น `npm run build` และมีการรัน `wrangler deploy` ต่อท้ายด้วย
(Cloudflare จะ deploy ให้อัตโนมัติเมื่อเจอ `wrangler.toml` ที่มี `main` ชี้ไปยัง Worker entry point)

Backend เป็น Cloudflare Worker ตัวเดียวที่ `worker/index.ts` ให้บริการทั้งไฟล์ static (ผ่าน binding
`ASSETS`) และ API:
- `GET /api/bookings`, `POST /api/bookings`
- `PATCH /api/bookings/:id/status`
- `GET /api/activity`, `POST /api/activity`
- `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, `DELETE /api/users/:id`
- `GET /api/options`, `POST /api/options`, `PATCH /api/options/:id`

หากเพิ่งอัปเดต repo และ D1 database ของคุณสร้างไว้ก่อนที่จะมีตาราง `users`/`option_items` ให้รัน
`npx wrangler d1 execute cpac_booking_db --remote --file=./schema.sql` อีกครั้ง (ปลอดภัย รันซ้ำได้
เพราะใช้ `IF NOT EXISTS` / `INSERT OR IGNORE`) เพื่อสร้างตารางที่ขาดและ seed ข้อมูลเดิม

## Features

- Authentication พร้อม 2 สิทธิ์ผู้ใช้งาน (Admin / Staff)
- หน้าตั้งค่าระบบสำหรับแอดมิน (`/settings`) แบ่งเป็น 2 แท็บ:
  - จัดการผู้ใช้งาน (เพิ่ม/แก้ไข/ลบบัญชี พร้อมป้องกันลบบัญชีตนเองและแอดมินคนสุดท้าย)
  - จัดการรายละเอียดคอนกรีต (กำลังอัด/ชนิดรถผสม/ลักษณะการเท/ชนิดงาน/ผู้ขาย — เพิ่ม แก้ไข และปิดใช้งานตัวเลือกที่ใช้ในฟอร์มใบสั่งจอง โดยไม่ลบข้อมูลประวัติเดิม)
- ปฏิทินคิวจัดส่งรายเดือนแบบ Interactive พร้อม Modal รายละเอียดงาน
- ฟอร์มคีย์ใบสั่งจองอัจฉริยะพร้อมคำนวณราคาอัตโนมัติ
- Toast แจ้งเตือนแบบเรียลไทม์เมื่อมีใบสั่งจองใหม่หรือมีการเปลี่ยนสถานะ
- รายงานยอดขายเชิงลึก (รายวัน/รายสัปดาห์/รายเดือน) พร้อมกราฟ Recharts และ Print Preview
- ประวัติระบบ (Activity Log) สำหรับแอดมิน รวมถึงบันทึกการเข้าสู่ระบบ

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · Cloudflare Workers · Cloudflare D1 · Recharts · React Router · date-fns
