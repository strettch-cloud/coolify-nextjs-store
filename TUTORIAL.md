# Deploy a Full-Stack App on Strettch Cloud with Coolify

Learn how to deploy a complete ecommerce application — **Next.js** frontend, **Express.js** API, and **MongoDB** database — on a [Strettch Cloud](https://cloud.strettch.com) VPS using [Coolify](https://coolify.io), an open-source self-hosting platform.

By the end of this tutorial, you'll have a fully working app with HTTPS, automated Docker builds, auto-deploy on git push, and a dashboard to manage everything.

---

## What We're Building

**ShopEase** — a simple ecommerce store with:

- Product browsing and search by category
- User registration and login (JWT auth)
- Shopping cart (persisted in localStorage)
- Checkout with shipping address
- Order history

### Architecture

```
Browser → Traefik (reverse proxy + auto-SSL)
            ├── shopease.yourdomain.com      → Next.js Frontend (port 3000)
            ├── api.shopease.yourdomain.com   → Express.js API (port 5000)
            └── coolify.yourdomain.com:8000   → Coolify Dashboard

            MongoDB (port 27017, internal only)
```

### Source Code

Both repositories are public — fork or clone them:

- **Frontend:** [strettch/coolify-nextjs-store](https://github.com/strettch/coolify-nextjs-store)
- **Backend:** [strettch/coolify-express-api](https://github.com/strettch/coolify-express-api)

### Tech Stack

| Layer     | Technology               |
|-----------|--------------------------|
| Frontend  | Next.js 15, React 19, Tailwind CSS 4 |
| Backend   | Express.js, Mongoose, JWT |
| Database  | MongoDB 7                |
| Platform  | Coolify v4 (self-hosted) |
| Server    | Strettch Cloud VPS       |

---

## Prerequisites

- A [Strettch Cloud](https://cloud.strettch.com) account
- A [GitHub](https://github.com) account
- A domain name (we'll use subdomains for each service)
- Basic familiarity with the terminal and SSH

---

## Step 1: Create a VPS on Strettch Cloud

Log in to [cloud.strettch.com](https://cloud.strettch.com) and create a new virtual server.

**Recommended specs:**

| Setting        | Value              |
|----------------|--------------------|
| OS             | Ubuntu 24.04 LTS   |
| CPU            | 2 vCPUs            |
| RAM            | 4 GB               |
| Disk           | 40 GB+ SSD         |

> **Why 4 GB RAM?** Coolify itself uses ~1.5 GB. MongoDB, the backend, and especially the Next.js Docker build need the rest. 2 GB will likely cause build failures.

Once created, note your server's **public IP address**. We'll refer to it as `YOUR_VPS_IP` throughout this tutorial.

### SSH into your server

```bash
ssh root@YOUR_VPS_IP
```

If your server uses a custom SSH port (like Strettch Cloud does), add `-p YOUR_PORT`:

```bash
ssh root@YOUR_VPS_IP -p 222
```

---

## Step 2: Install Coolify

Coolify provides a single command that installs everything — Docker, Docker Compose, and Coolify itself:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

This takes 2–5 minutes depending on your server's connection speed. You'll see output like:

```
Step 1/9: Installing required packages
Step 2/9: Checking OpenSSH server configuration
Step 3/9: Checking Docker installation
...
Step 9/9: Installing Coolify
```

> **Note:** If you see an error about `dpkg lock`, it means the system is running background updates. Wait a minute and try again:
> ```bash
> # Wait for the lock to release, then install
> while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 2; done
> curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
> ```

When it finishes, you'll see:

```
Your instance is ready to use!
You can access Coolify through your Public IPV4: http://YOUR_VPS_IP:8000
```

### Complete initial setup

1. Open `http://YOUR_VPS_IP:8000` in your browser
2. Create your admin account (email + password)
3. On the onboarding screen, click **\"Let's go!\"**
4. Choose **\"This Machine\"** (Quick Start) — this deploys everything on the same server running Coolify
5. Click **\"Create My First Project\"**
6. Click **\"Go to Dashboard\"**

You now have Coolify running with a project called \"My first project\" and a \"production\" environment.

---

## Step 3: Set Up DNS Records

Before deploying, point your subdomains to the server. In your DNS provider, create three **A records**:

| Type | Name              | Value        | TTL |
|------|-------------------|--------------|-----|
| A    | `shopease`        | YOUR_VPS_IP  | 300 |
| A    | `api.shopease`    | YOUR_VPS_IP  | 300 |
| A    | `coolify`         | YOUR_VPS_IP  | 300 |

For example, if your domain is `example.com`, you'll get:
- `shopease.example.com` — frontend
- `api.shopease.example.com` — backend API
- `coolify.example.com` — Coolify dashboard

> DNS propagation usually takes 1–5 minutes. You can verify with: `dig shopease.yourdomain.com +short`

---

## Step 4: Connect GitHub to Coolify

To enable **automatic deployments on git push**, we'll create a GitHub App that connects Coolify to your repositories. This is the recommended approach — it gives you webhook integration, auto-deploy on push, and PR preview support.

### Fork the repositories

If you haven't already, fork both repos to your GitHub account or organization:

- [strettch/coolify-express-api](https://github.com/strettch/coolify-express-api)
- [strettch/coolify-nextjs-store](https://github.com/strettch/coolify-nextjs-store)

### Create a GitHub App in Coolify

1. In Coolify, go to **Sources** in the left sidebar
2. Click **\"+ Add\"**
3. Select **GitHub**
4. Fill in the form:
   - **Name:** Choose a name (e.g., `my-coolify`)
   - **Organization (on GitHub):** Enter your GitHub organization name, or leave empty to use your personal account
5. Click **Continue**

This redirects you to GitHub to create the app.

6. On GitHub, click **\"Create GitHub App for [your-org]\"**
7. You'll be redirected to install the app — click **Install**
8. Choose **\"Only select repositories\"** and select both:
   - `coolify-express-api`
   - `coolify-nextjs-store`
9. Click **Install**

You'll be redirected back to Coolify. The GitHub source is now connected.

> **Tip:** You can verify the connection in Coolify under **Sources** — you should see your GitHub App listed with a green status.

---

## Step 5: Deploy MongoDB

1. Go to **My first project → production → + New**
2. Search for **\"mongodb\"**
3. Click **MongoDB** under the Databases section

Coolify creates the database with auto-generated credentials. On the configuration page, you'll see:

- **Image:** `mongo:7`
- **Username:** `root` (auto-generated)
- **Password:** a long random string (auto-generated)
- **Mongo URL (internal):** something like:
  ```
  mongodb://root:GENERATED_PASSWORD@CONTAINER_ID:27017/?directConnection=true
  ```

> **Important:** Copy the **Mongo URL (internal)** — you'll need it for the backend's environment variables. We'll modify it slightly when configuring the backend.

4. Click **Start** to launch MongoDB

Wait until the status shows **\"Running (healthy)\"**.

---

## Step 6: Deploy the Express.js Backend

### Add the application

1. Go to **My first project → production → + New**
2. Select **Private Repository (with GitHub App)**
3. You'll see your connected GitHub App — select it
4. Choose the **coolify-express-api** repository
5. Select the **main** branch
6. Set **Build Pack** to **Dockerfile**
7. Click **Continue**

### Configure the application

On the configuration page, update these settings:

**General:**
- **Name:** `shopease-api`
- **Domain:** `https://api.shopease.yourdomain.com`
- **Ports Exposes:** `5000`

Click **Save**.

### Add environment variables

Go to the **Environment Variables** tab and click **Developer view**. Paste these variables:

```env
MONGODB_URI=mongodb://root:GENERATED_PASSWORD@CONTAINER_ID:27017/shopease?authSource=admin&directConnection=true
JWT_SECRET=your-secret-key-change-this-to-something-random
PORT=5000
FRONTEND_URL=https://shopease.yourdomain.com
```

> **About the MongoDB URI:**
> - Take the internal URL from Step 5
> - Add `/shopease` after the port to specify the database name
> - Add `?authSource=admin&directConnection=true` as query parameters
>
> Example: If your internal URL is `mongodb://root:abc123@n58y4pvy:27017/?directConnection=true`, change it to:
> `mongodb://root:abc123@n58y4pvy:27017/shopease?authSource=admin&directConnection=true`

Click **Save All Environment Variables**.

### Deploy

Click the **Deploy** button. Coolify will:
1. Clone the repository via the GitHub App
2. Build the Docker image using the Dockerfile
3. Start the container on port 5000
4. Configure Traefik to route `api.shopease.yourdomain.com` to this container
5. Automatically provision an SSL certificate via Let's Encrypt

This takes about 30 seconds. Once deployed, verify it works:

```bash
curl https://api.shopease.yourdomain.com/api/health
# Should return: {"status":"ok","service":"shopease-api"}
```

### Seed the database

The backend includes a seed script with 10 sample products. To run it:

1. Go to the **Terminal** tab for shopease-api in Coolify
2. Run:
   ```bash
   node src/seed.js
   ```

Or via SSH:

```bash
# Find the backend container name
docker ps --format '{{.Names}}' | grep -v coolify | grep -v mongo

# Exec into it and run the seed
docker exec CONTAINER_NAME node src/seed.js
```

You should see:
```
Connected to MongoDB
Cleared existing products
Seeded 10 products
Done!
```

Verify:
```bash
curl https://api.shopease.yourdomain.com/api/products
```

---

## Step 7: Deploy the Next.js Frontend

### Add the application

1. Go to **My first project → production → + New**
2. Select **Private Repository (with GitHub App)**
3. Select your GitHub App, then choose the **coolify-nextjs-store** repository
4. Select the **main** branch
5. Set **Build Pack** to **Dockerfile**
6. Click **Continue**

### Configure the application

**General:**
- **Name:** `shopease-store`
- **Domain:** `https://shopease.yourdomain.com`
- **Ports Exposes:** `3000` (should already be set)

Click **Save**.

### Add environment variables

Go to **Environment Variables** tab → **Developer view** and add:

```env
NEXT_PUBLIC_API_URL=https://api.shopease.yourdomain.com
```

Click **Save All Environment Variables**.

> **Important:** After saving, switch to **Normal view** and verify that the `NEXT_PUBLIC_API_URL` variable has **\"Available at Buildtime\"** checked. This is required because the Dockerfile uses `ARG NEXT_PUBLIC_API_URL` to inject the API URL during the build process. Coolify enables this by default, but double-check.

### Deploy

Click **Deploy**. The Next.js build takes longer than the backend (1–2 minutes) because it:
1. Installs dependencies
2. Builds the Next.js app (compiles pages, generates static content)
3. Creates a standalone production image

> **Build failures:** If the build fails with exit code 255, it's usually a transient Docker BuildKit issue. Click **Redeploy** to try again. If it keeps failing, try clearing the Docker build cache via SSH:
> ```bash
> docker builder prune -f
> ```

Once deployed, visit `https://shopease.yourdomain.com` — you should see the ShopEase store with all 10 products!

---

## Step 8: Test the Full Application

Walk through the complete user flow:

1. **Browse products** — Visit the homepage and try the category filters
2. **View a product** — Click any product to see the detail page
3. **Add to cart** — Click \"Add to cart\" on a product
4. **View cart** — Navigate to the cart page, adjust quantities
5. **Register** — Create an account (any email/password, min 6 chars)
6. **Checkout** — Enter a shipping address and place the order
7. **View orders** — Check your order history

### API endpoints to test

```bash
# Health check
curl https://api.shopease.yourdomain.com/api/health

# Get all products
curl https://api.shopease.yourdomain.com/api/products

# Get products by category
curl https://api.shopease.yourdomain.com/api/products?category=Electronics

# Register a user
curl -X POST https://api.shopease.yourdomain.com/api/auth/register \
  -H \"Content-Type: application/json\" \
  -d '{\"name\": \"Test User\", \"email\": \"test@example.com\", \"password\": \"password123\"}'

# Login
curl -X POST https://api.shopease.yourdomain.com/api/auth/login \
  -H \"Content-Type: application/json\" \
  -d '{\"email\": \"test@example.com\", \"password\": \"password123\"}'
```

### Test auto-deploy

Since we set up the GitHub App, any push to the `main` branch will trigger an automatic deployment. Try it:

1. Make a small change to one of the repos (e.g., update a product name in `seed.js`)
2. Push to `main`
3. Go to Coolify → your app → **Deployments** tab
4. You should see a new deployment triggered automatically

---

## Project Structure

### Backend (`coolify-express-api`)

```
coolify-express-api/
├── src/
│   ├── index.js           # Express app entry point
│   ├── config/db.js       # MongoDB connection
│   ├── middleware/auth.js  # JWT authentication
│   ├── models/
│   │   ├── User.js        # User model (bcrypt password hashing)
│   │   ├── Product.js     # Product model
│   │   └── Order.js       # Order model
│   ├── routes/
│   │   ├── auth.js        # POST /register, POST /login, GET /me
│   │   ├── products.js    # GET /, GET /:id
│   │   └── orders.js      # POST / (auth), GET / (auth)
│   └── seed.js            # Seed 10 sample products
├── Dockerfile
├── .env.example
└── package.json
```

### Frontend (`coolify-nextjs-store`)

```
coolify-nextjs-store/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home — product grid
│   │   ├── products/[id]/      # Product detail page
│   │   ├── cart/               # Shopping cart
│   │   ├── checkout/           # Checkout form
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   └── orders/             # Order history
│   ├── components/
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── Footer.tsx          # Footer with links
│   │   ├── ProductCard.tsx     # Product card component
│   │   └── CartItem.tsx        # Cart item component
│   ├── context/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── CartContext.tsx      # Cart state (localStorage)
│   └── lib/
│       └── api.ts              # Axios HTTP client
├── Dockerfile                   # Multi-stage build (standalone)
├── .env.example
└── package.json
```

---

## Troubleshooting

### Build fails with exit code 255
This is usually a transient Docker BuildKit error. Click **Redeploy** in Coolify. If it persists:
```bash
ssh root@YOUR_VPS_IP
docker builder prune -f
```
Then redeploy from Coolify.

### Build fails with \"/app/public: not found\"
The Dockerfile expects a `public/` directory. Make sure it exists in your repo (even if empty — add a `.gitkeep` file).

### MongoDB connection fails
- Verify the `MONGODB_URI` uses the **internal** hostname (the container ID), not `localhost`
- Make sure you added `?authSource=admin` to the URI
- Check that MongoDB is running in Coolify (status should say \"Running (healthy)\")

### Frontend shows no products
- Verify the backend is running: `curl https://api.shopease.yourdomain.com/api/health`
- Make sure you ran the seed script (Step 6)
- Check that `NEXT_PUBLIC_API_URL` is set correctly and was available at **build time**
- If you changed the env var, you need to **redeploy** (not just restart) because Next.js bakes it in at build time

### SSL certificate not working
Traefik auto-provisions certificates via Let's Encrypt. Make sure:
- DNS records are pointing to your VPS IP
- Port 80 and 443 are not blocked by a firewall
- The domain in Coolify starts with `https://`

### dpkg lock error during Coolify installation
The server is running background updates. Wait and retry:
```bash
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 2; done
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### GitHub App not showing repositories
Make sure you installed the GitHub App on the correct organization/account and granted access to the specific repositories. You can manage installations at `https://github.com/settings/installations`.

---

## What's Next?

Now that your app is deployed with auto-deploy, here are some things you could explore:

- **Set up backups** for MongoDB in Coolify (Backups tab on the database)
- **Add monitoring** with Coolify's built-in metrics
- **Custom domain** — point your main domain instead of a subdomain
- **Add more features** — product search, reviews, admin panel, payment integration
- **Preview deployments** — Coolify can deploy PR branches for review before merging

---

## Summary

In this tutorial, we deployed a full-stack ecommerce application on Strettch Cloud using Coolify:

1. Created a VPS on Strettch Cloud (2 vCPUs, 4 GB RAM)
2. Installed Coolify with a single command
3. Set up DNS records for three subdomains
4. Connected GitHub to Coolify with a GitHub App for auto-deploy
5. Deployed MongoDB as a managed database
6. Deployed the Express.js API with environment variables
7. Seeded the database with sample products
8. Deployed the Next.js frontend with build-time configuration
9. Tested the complete application end-to-end

All three services are managed through Coolify's dashboard with automatic SSL, Docker builds, auto-deploy on push, and deployment logs — no CI/CD pipeline needed.

**Links:**
- [Strettch Cloud](https://cloud.strettch.com)
- [Coolify Documentation](https://coolify.io/docs)
- [Frontend Source Code](https://github.com/strettch/coolify-nextjs-store)
- [Backend Source Code](https://github.com/strettch/coolify-express-api)
- [Live Demo](https://shopease.strettchcloud.com)
