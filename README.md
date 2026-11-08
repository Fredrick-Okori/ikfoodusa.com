# Magnum Liquors

Next.js storefront and inventory dashboard for Magnum Liquors.

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase project URL and anon key. Add the service role key only when using team administration locally.
3. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## Production Checks

Run these before deployment:

```bash
npm run lint
npm run build
```

The production environment must define `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be prefixed with `NEXT_PUBLIC_` or exposed to client code.

Apply `supabase_schema.sql` to the target Supabase project before first deploy, including the `buying_price` product column and order item profit snapshots.

## Deployment

The app can run on Vercel or any Node.js host that supports Next.js:

```bash
npm run build
npm run start
```

Configure the environment variables in the hosting provider rather than committing `.env` files. Review Supabase RLS policies and replace permissive policies with authenticated role policies before exposing administrative tables publicly.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# magnumliquors.com
# ikfoodusa.com
