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

## Database

Use one MongoDB Atlas database for the backend services:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/taskcal?retryWrites=true&w=majority
```

Auth and password recovery share the `users` collection through the same database. Task data is stored in the `tasks` collection in that same database.

## Required Env Values
 
### frontend

- `VITE_API_URL`: same-origin production API base, usually blank when using Ingress.
- `VITE_AUTH_URL`: local auth service URL.
- `VITE_NOTIFICATION_URL`: local notification service URL.
- `VITE_TASK_URL`: local task service URL.
- `VITE_PASSWORD_URL`: local password service URL.

### auth-service

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `NOTIFICATION_SERVICE_URL`

### task-service

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `NOTIFICATION_SERVICE_URL`
- `REMINDER_CRON`

### password-service

- `PORT`
- `MONGO_URI`
- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `CLIENT_URL`
- `NOTIFICATION_SERVICE_URL`
- `OTP_TTL_SECONDS`

### notification-service

- `PORT`
- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `CLIENT_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Kubernetes

Manifests live in `k8s/`. Copy `k8s/secret.example.yaml`, replace the values, and apply the manifests in this order:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.example.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/task-service.yaml
kubectl apply -f k8s/password-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

Production exposes the app and all backend services through one Ingress host. Local development can keep using separate backend URLs through the frontend `.env` file.
