# BURAPACONCRETE CPAC Booking

ระบบรับจองและบริหารจัดการคิวส่งคอนกรีตผสมเสร็จ (Ready-Mix Concrete Booking) สำหรับ BURAPACONCRETE
สร้างด้วย React (Vite) + TypeScript + Tailwind CSS ในสไตล์ Warm-Minimalist พร้อมระบบฐานข้อมูลบน
Cloudflare D1 ผ่าน Pages Functions (โพลข้อมูลทุก 4 วินาทีเพื่อจำลอง Real-time) และรองรับ LocalStorage
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

ระบบทำงานได้ทันทีในโหมด LocalStorage โดยไม่ต้องตั้งค่าใดๆ (ใช้ตอน `npm run dev` เพราะไม่มี
Pages Functions ให้เรียก) เมื่อ deploy ขึ้น Cloudflare Pages พร้อมผูก D1 database แล้ว แอปจะตรวจจับ
`/api/bookings` ได้อัตโนมัติและสลับไปโหมด Cloudflare D1 ทันที (แสดงสถานะที่ Mini Utility Bar)

ขั้นตอนตั้งค่า D1 (ทำครั้งเดียว):

```bash
# 1. สร้างฐานข้อมูล D1
npx wrangler d1 create cpac_booking_db
# คัดลอกค่า database_id ที่ได้ไปใส่ใน wrangler.toml (แทน REPLACE_WITH_YOUR_D1_DATABASE_ID)

# 2. รัน schema เพื่อสร้างตาราง
npx wrangler d1 execute cpac_booking_db --remote --file=./schema.sql
```

จากนั้น deploy โปรเจกต์ (ผ่าน Git integration ของ Cloudflare Pages ที่ผูกไว้แล้ว หรือ
`npx wrangler pages deploy dist`) — เมื่อมี `wrangler.toml` อยู่ใน repo, Cloudflare Pages จะอ่าน
D1 binding จากไฟล์นี้โดยอัตโนมัติ

Backend API (Cloudflare Pages Functions) อยู่ที่ `functions/api/`:
- `GET /api/bookings`, `POST /api/bookings`
- `PATCH /api/bookings/:id/status`
- `GET /api/activity`

## Features

- Authentication พร้อม 2 สิทธิ์ผู้ใช้งาน (Admin / Staff)
- ปฏิทินคิวจัดส่งรายเดือนแบบ Interactive พร้อม Modal รายละเอียดงาน
- ฟอร์มคีย์ใบสั่งจองอัจฉริยะพร้อมคำนวณราคาอัตโนมัติ
- Toast แจ้งเตือนแบบเรียลไทม์เมื่อมีใบสั่งจองใหม่หรือมีการเปลี่ยนสถานะ
- รายงานยอดขายเชิงลึก (รายวัน/รายสัปดาห์/รายเดือน) พร้อมกราฟ Recharts และ Print Preview
- ประวัติระบบ (Activity Log) สำหรับแอดมิน

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · Cloudflare Pages Functions · Cloudflare D1 · Recharts · React Router · date-fns
