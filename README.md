
## Live Demo
https://pinterest-fawn.vercel.app

This project is the frontend of a Pinterest-style image sharing web application. It allows users to create accounts, upload images or short videos, create boards, save pins, like and comment on posts, and follow other users.

The frontend is built using React with TypeScript, Vite, and Tailwind CSS. It connects to a backend API built with Node.js, Express, MongoDB (Atlas), and Cloudinary for media storage. The user interface is responsive and adapts to different screen sizes, following a grid-based layout similar to Pinterest.

## Features
- User authentication (register, login, logout)
- Create and manage boards
- Upload image and video pins
- Like and comment on pins
- Follow and unfollow users
- Save pins for later viewing
- Fully responsive layout

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS
-  Vercel (Frontend deployment)
- Render (Backend deployment)

## Environment Variables
To run the project locally, create a .env file in the project root with the following variables:

```env
VITE_API_URL=https://pinterest-backend-088x.onrender.com
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=


