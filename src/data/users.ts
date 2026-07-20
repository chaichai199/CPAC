import type { AppUser } from '@/types'

export const DEMO_USERS: AppUser[] = [
  {
    id: 'u-admin-1',
    username: 'admin',
    password: 'admin123',
    displayName: 'ผู้ดูแลระบบ (Admin)',
    role: 'admin',
  },
  {
    id: 'u-staff-1',
    username: 'staff',
    password: 'staff123',
    displayName: 'เจ้าหน้าที่คีย์งาน',
    role: 'staff',
  },
]

export const SELLERS = [
  'คุณสมชาย ใจดี',
  'คุณวราภรณ์ ศรีสุข',
  'คุณอนุชา พงษ์พันธ์',
  'คุณกัญญา ทองแท้',
]

export const MIXER_TYPES = ['รถโม่ 6 คิว', 'รถโม่ 7 คิว', 'รถโม่ 10 คิว', 'ปั๊มคอนกรีต']

export const POUR_METHODS = ['เทด้วยรางเท', 'เทด้วยปั๊มบูม', 'เทด้วยปั๊มลาก', 'เทตรงจากรถโม่']

export const JOB_TYPES = ['ฐานราก', 'เสา', 'คาน', 'พื้น', 'ถนน', 'กำแพงกันดิน', 'อื่นๆ']

export const CONCRETE_STRENGTHS = ['180 ksc', '210 ksc', '240 ksc', '280 ksc', '320 ksc', '350 ksc']
