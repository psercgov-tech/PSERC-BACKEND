# PSERC API

NestJS backend for Plateau State Electricity Regulatory Commission.

## Stack

- NestJS + MongoDB (Mongoose)
- Argon2 password hashing
- JWT auth
- Cloudinary media uploads
- Swagger at `/docs`

## Setup

```bash
cp .env.example .env
# set MONGODB_URI + Cloudinary keys
npm install
npm run start:dev
```

API: `http://localhost:4000/api`  
Docs: `http://localhost:4000/docs`

Default admin (seeded on boot):

- email: `admin@pserc.ng`
- password: `Admin@123456`

## Key routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | public | Admin login |
| GET | `/api/auth/me` | JWT | Current admin |
| GET | `/api/admins` | JWT | List staff/admin accounts |
| POST | `/api/admins` | JWT | Create staff (`initials@pserc.plateau.gov.ng`) |
| PATCH | `/api/admins/:id` | JWT | Update staff (password / active) |
| DELETE | `/api/admins/:id` | JWT | Delete staff account |
| POST | `/api/portal/auth/register` | public | Portal user register |
| POST | `/api/portal/auth/login` | public | Portal user login |
| GET | `/api/portal/auth/me` | portal JWT | Current portal user |
| GET | `/api/portal/complaints` | portal JWT | List own complaints |
| POST | `/api/portal/complaints` | portal JWT | Submit complaint |
| POST | `/api/contacts` | public | Get in Touch form |
| GET | `/api/contacts` | JWT | List messages |
| DELETE | `/api/contacts/:id` | JWT | Delete message |
| GET | `/api/news` | public | Published news |
| GET | `/api/news/admin/all` | JWT | All news |
| POST | `/api/news` | JWT | Create news (+ optional image) |
| PATCH | `/api/news/:id` | JWT | Update news |
| DELETE | `/api/news/:id` | JWT | Delete news |
| GET | `/api/media` | JWT | List media |
| POST | `/api/media/upload` | JWT | Upload to Cloudinary |
| DELETE | `/api/media/:id` | JWT | Delete media |
