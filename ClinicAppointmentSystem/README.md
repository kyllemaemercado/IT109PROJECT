# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## CSU Clinic Backend (local dev)

This project now contains a minimal Express backend in the `server/` folder used for user signup/login and appointment persistence.

To run the backend in development mode:

1. Open a second terminal:

```powershell
cd server
npm install
npm run dev
```

2. Frontend expects backend at http://localhost:5000. The Frontend will call `/api/` endpoints for users and appointments.

Environment variables for notifications (optional):

- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM — if set, nodemailer sends real email to providers. If not set, nodemailer uses Ethereal (development) and logs preview URLs.
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM — if set, Twilio will be used to send SMS to patients when providers confirm appointments.

Create a `.env` file in the `server/` folder with the values, for example:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=supersecret
SMTP_FROM=no-reply@csu-clinic.local

TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_FROM=+15551234567
```
