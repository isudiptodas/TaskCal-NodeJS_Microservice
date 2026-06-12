![diagram](https://github.com/isudiptodas/TaskCal-NodeJS_Microservice/blob/main/diagram.png)

# TaskCal Microservices

TaskCal is a calendar-first task planner built as small Node.js microservices with a React + TypeScript frontend.

MongoDB is expected to run on MongoDB Atlas. All backend services use the same Atlas database URI, so users and tasks live in separate collections under one database, for example `taskcal`.
Redis is expected to run on Redis Cloud. The password and notification services use `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST`, and `REDIS_PORT`.

## Services

- `frontend`: React + TypeScript + Tailwind UI.
- `auth-service`: registration, login, JWT cookie session, current user, logout.
- `task-service`: authenticated task CRUD and daily reminder scanning.
- `password-service`: password recovery OTP flow with Redis TTL.
- `notification-service`: BullMQ email queue for welcome, OTP, and task reminder emails.

## Local Ports

- Frontend: `http://localhost:5173`
- Auth: `http://localhost:5000/api/auth`
- Notification: `http://localhost:6000/api/notification`
- Task: `http://localhost:7000/api/task`
- Password recovery: `http://localhost:8000/api/password-recovery`

Production exposes the app and all backend services through one Ingress host. Local development can keep using separate backend URLs through the frontend `.env` file.
