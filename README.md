# Welcome to CineWorld! The World of Cinema.
CineWorld is a modern movie and TV show discovery website built with TypeScript, Next.js 15, and Tailwind CSS, featuring TMDB API integration.

## Overview

Cineworld is a dynamic and immersive movie and TV show discovery platform that brings you information about an extensive collection of films and TV shows from various genres. Powered by React, Next.js 15, TypeScript, and Tailwind CSS, Cineworld offers an unparalleled user experience with modern UI components, responsive design, and smooth animations.

## Screenshots
![Screenshot 2023-07-13 230452](https://github.com/alanvarghesepaul22/CINEWORLD-NextJS/assets/86376232/965879a8-9604-4b77-a83c-026f594a2e21)

![Screenshot 2023-07-21 211717](https://github.com/alanvarghesepaul22/CINEWORLD-NextJS/assets/86376232/fae66266-2242-4311-9f53-8258c644b030)

## Responsive Design 

![Untitled-1](https://github.com/alanvarghesepaul22/CINEWORLD-NextJS/assets/86376232/a7bee4e3-59bd-4f64-8e47-d8d821f4425d)


## Key Features

- **🎬 Vast Content Library**: Explore movies and TV shows from trending, popular, top-rated, and latest categories
- **🎨 Modern UI/UX**: Beautiful hero section with animated slides, Shadcn/ui components, and smooth Framer Motion animations
- **📱 Fully Responsive**: Optimized for mobile, tablet, and desktop with 2-column mobile grid layout
- **⚡ Performance Optimized**: Next.js 15 with App Router, SWR caching, and TypeScript for fast loading
- **🎯 Advanced Search**: Enhanced search functionality with filters (coming in future updates)
- **❤️ Watchlist**: Save favorite movies and TV shows to local storage
- **🔔 Error Handling**: Graceful error handling with toast notifications
- **🎭 Category Sections**: Browse by Popular, Top Rated, Now Playing, and more with "See All" links
- **🔒 Production Ready**: Secure API key handling, environment variable configuration

## Installation and Setup

```bash
npm install
cp .env.example .env.local   # дараа нь утгуудыг бөглөнө
npm run dev
```

### Шаардлагатай үйлчилгээ
| Үйлчилгээ | Зориулалт | Env |
|---|---|---|
| TMDB | Кино/цувралын мэдээлэл | `TMDB_ACCESS_TOKEN` (эсвэл `API_KEY`) |
| Supabase | Өөрийн киноны сан | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Cloudflare R2 | Видео хадгалалт | `R2_*` |
| Cloudinary | Poster/backdrop upload | `CLOUDINARY_*` |
| Gemini | AI facts / suggestions | `GEMINI_API_KEY`, `ALLOWED_ORIGINS` |
| Upstash Redis (заавал биш) | Rate limit-ийг instance хооронд хуваалцах | `UPSTASH_REDIS_REST_URL/TOKEN` |
| Admin / Auth | Supabase Auth, `profiles.role='admin'` | `supabase/migrations_002_auth_premium.sql` |
| Төлбөр | Wire (QPay) – `/premium` | `WIRE_SECRET_KEY`, `WIRE_WEBHOOK_SECRET` |

### Өгөгдлийн сан
Supabase SQL editor дээр `supabase/schema.sql`, дараа нь `supabase/migrations_001_improvements.sql`-ийг ажиллуулна.

### Аюулгүй байдал
- TMDB түлхүүр зөвхөн серверт. Браузер `/api/tmdb/*` proxy-оор дамжина.
- Admin эрх `profiles.role`-оор (RLS-ээр хамгаалагдсан, клиент өөрчилж чадахгүй) шалгагдана.
- Webhook HMAC-SHA256 + timestamp-аар баталгаажиж, төлбөрийг Wire API-аас дахин шалгана.
- Зөвхөн өөрт эрхтэй (лицензтэй) контентыг байршуулна.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **State Management**: SWR (for API caching)
- **Icons**: Lucide React
- **API**: TMDB API
- **Notifications**: Sonner

## Production Deployment

### Environment Variables
Production дээр `.env.example` доторх бүх хувьсагчийг hosting платформдоо тохируулна.

### Recommended Platforms

#### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add the environment variables from `.env.example` in Vercel's dashboard
3. Deploy automatically on every push to main branch

#### Netlify
1. Connect your repository
2. Set environment variables in build settings
3. Configure build command: `npm run build`

#### Railway / Render
1. Connect your repository
2. Set environment variables in service settings
3. Deploy with default Next.js settings

### Security Notes
- Never commit API keys to version control
- Use environment variables for all sensitive data
- The API key is only used server-side for security

## Contributing

We welcome contributions from the open-source community! If you find a bug, have a feature request, or want to contribute in any way, please feel free to submit a pull request.

## Acknowledgments

- Our gratitude to [TMDB](https://www.themoviedb.org/) for providing the incredible API that powers Cineworld.

- A big thank you to the developers of React, Next.js, and Tailwind CSS for creating these fantastic frameworks that made this project possible.

---

We hope you enjoy exploring Cineworld as much as we enjoyed creating it! Your feedback and support mean the world to us. Feel free to reach out with any questions or suggestions.

Happy movie streaming! 🍿🎥

## Admin + Premium тохируулга
1. Supabase SQL Editor дээр `supabase/migrations_002_auth_premium.sql` ажиллуулна.
2. Сайтад бүртгүүлж, дараа нь SQL Editor дээр: `update public.profiles set role='admin' where email='та@имэйл';`
3. Supabase → Auth → URL Configuration: Site URL болон `https://<domain>/auth/callback`-ийг Redirect URLs-д нэмнэ.
4. Wire dashboard (app.wire.mn): KYC, project, QPay operator идэвхжүүлж, API key авна → `WIRE_SECRET_KEY`.
5. Wire → Webhooks: `https://<domain>/api/webhooks/wire`, event `payment_intent.*` → signing secret-ийг `WIRE_WEBHOOK_SECRET`-д.
