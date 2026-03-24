# ShopEase Store

Next.js frontend for the ShopEase ecommerce application.

Part of the **"Deploy a Full-Stack App on Strettch Cloud with Coolify"** tutorial.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/strettch/coolify-nextjs-store.git
cd coolify-nextjs-store

# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Product listing with category filters
- Product detail pages
- Shopping cart (persisted in localStorage)
- User registration and login (JWT)
- Checkout flow with shipping address
- Order history

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Axios

## Deploy with Coolify

See the full tutorial: [Deploy a Full-Stack App on Strettch Cloud with Coolify](./TUTORIAL.md)

## License

MIT
