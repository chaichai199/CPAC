# BURAPACONCRETE CPAC Booking

ระบบรับจองและบริหารจัดการคิวส่งคอนกรีตผสมเสร็จ (Ready-Mix Concrete Booking) สำหรับ BURAPACONCRETE
สร้างด้วย React (Vite) + TypeScript + Tailwind CSS ในสไตล์ Warm-Minimalist พร้อมระบบซิงค์ข้อมูล
แบบเรียลไทม์ผ่าน Firebase Firestore และรองรับ LocalStorage Fallback อัตโนมัติเมื่อไม่ได้เชื่อมต่อคลาวด์

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

## Firebase (optional)

ระบบทำงานได้ทันทีในโหมด LocalStorage โดยไม่ต้องตั้งค่าใดๆ หากต้องการเปิดใช้งาน Firestore
แบบเรียลไทม์ข้ามอุปกรณ์ ให้คัดลอก `.env.example` เป็น `.env.local` แล้วกรอกค่า config ของโปรเจกต์
Firebase ของคุณ — แอปจะตรวจจับและสลับไปโหมด Firestore Cloud ให้อัตโนมัติ (แสดงสถานะที่ Mini Utility Bar)

## Features

- Authentication พร้อม 2 สิทธิ์ผู้ใช้งาน (Admin / Staff)
- ปฏิทินคิวจัดส่งรายเดือนแบบ Interactive พร้อม Modal รายละเอียดงาน
- ฟอร์มคีย์ใบสั่งจองอัจฉริยะพร้อมคำนวณราคาอัตโนมัติ
- Toast แจ้งเตือนแบบเรียลไทม์เมื่อมีใบสั่งจองใหม่หรือมีการเปลี่ยนสถานะ
- รายงานยอดขายเชิงลึก (รายวัน/รายสัปดาห์/รายเดือน) พร้อมกราฟ Recharts และ Print Preview
- ประวัติระบบ (Activity Log) สำหรับแอดมิน

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · Firebase Firestore · Recharts · React Router · date-fns
