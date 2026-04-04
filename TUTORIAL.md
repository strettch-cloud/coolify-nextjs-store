# How to Deploy a Full-Stack Ecommerce App on Strettch Cloud Using Coolify

### Introduction

In this tutorial, you will deploy **ShopEase**, a full-stack ecommerce application, on a [Strettch Cloud](https://cloud.strettch.com) using [Coolify](https://coolify.io) — an open-source, self-hosted platform for managing app deployments.

ShopEase consists of three services: a **Next.js 15** frontend for the customer UI, an **Express.js** backend API handling authentication and orders, and a **MongoDB 7** database. Coolify orchestrates all three inside Docker containers and uses **Traefik** as a reverse proxy to handle routing and automatic SSL certificates.

By the end of this guide, you will have a production-ready application with HTTPS, automated Docker builds, and auto-deploy on every git push — all managed through a web dashboard.

**Source code:**

- Frontend: [strettch-cloud/coolify-nextjs-store](https://github.com/strettch-cloud/coolify-nextjs-store)
- Backend: [strettch-cloud/coolify-express-api](https://github.com/strettch-cloud/coolify-express-api)
- Live demo: [shopease.strettchcloud.com](https://shopease.strettchcloud.com)

**Architecture overview:**

```
Browser → Traefik (reverse proxy + auto-SSL)
            ├── shopease.strettchcloud.com      → Next.js Frontend (port 3000)
            ├── api.shopease.strettchcloud.com   → Express.js API (port 5000)
            └── coolify.strettchcloud.com:8000   → Coolify Dashboard

            MongoDB (port 27017, internal only)
```

## Prerequisites

Before you begin, make sure you have the following:

- A [Strettch Cloud](https://cloud.strettch.com) account for provisioning a VPS
- A [GitHub](https://github.com) account to host and connect your repositories
- A registered domain name with access to its DNS settings (you will create subdomains for each service)
- Basic familiarity with the terminal, SSH, and command-line tools

## Step 1 — Creating a VPS on Strettch Cloud

In this step, you will provision a virtual private server on Strettch Cloud. This server will host Coolify and all three application services.

1. Log in to [cloud.strettch.com](https://cloud.strettch.com).
2. Click **Create Server** and configure it with the following specs:

   | Setting  | Value             |
   | -------- | ----------------- |
   | OS       | Ubuntu 24.04 LTS  |
   | CPU      | 2 vCPUs           |
   | RAM      | 4 GB              |
   | Disk     | 40 GB+ SSD        |

3. Click **Create** and wait for the server to become active.
4. Note your server's **public IP address**. This tutorial refers to it as `YOUR_VPS_IP`.

> **Note:** 4 GB of RAM is the recommended minimum. Coolify itself uses approximately 1.5 GB, and the Next.js Docker build process requires additional memory. Servers with 2 GB of RAM will likely experience build failures.

Once the server is ready, connect via SSH:

```bash
ssh root@YOUR_VPS_IP
```

If your server uses a custom SSH port (Strettch Cloud uses port `222`), specify it with the `-p` flag:

```bash
ssh root@YOUR_VPS_IP -p 222
```

You now have a running VPS ready for Coolify installation.

## Step 2 — Installing Coolify

In this step, you will install Coolify on your VPS. Coolify provides a one-line installer that sets up Docker, Docker Compose, and the Coolify platform automatically.

Run the following command on your server:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

The installation takes 2 to 5 minutes. You will see progress output as it completes each stage:

```
Step 1/9: Installing required packages
Step 2/9: Checking OpenSSH server configuration
Step 3/9: Checking Docker installation
...
Step 9/9: Installing Coolify
```

When it finishes, you will see a message like:

```
Your instance is ready to use!
You can access Coolify through your Public IPV4: http://YOUR_VPS_IP:8000
```

> **Note:** If you encounter a `dpkg lock` error, the system is running background package updates. Wait a moment and retry:
>
> ```bash
> while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 2; done
> curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
> ```

### Completing the Initial Setup

1. Open `http://YOUR_VPS_IP:8000` in your browser.
2. Create your admin account by entering an email and password.
3. On the onboarding screen, click **Let's go!**
4. Choose **This Machine (Quick Start)** — this deploys everything on the same server running Coolify.
5. Click **Create My First Project**.
6. Click **Go to Dashboard**.

You now have Coolify running with a default project called "My first project" and a "production" environment.

## Step 3 — Setting Up DNS Records

In this step, you will create DNS records that point your subdomains to the VPS. This is required before deploying any services so that Traefik can route traffic and provision SSL certificates.

> **Note:** Throughout this tutorial, replace `YOUR_DOMAIN` with your registered domain name wherever it appears in configuration values, commands, and URLs.

In your domain registrar or DNS provider, create three **A records** pointing to your VPS IP address:

| Type | Name           | Value       | TTL |
| ---- | -------------- | ----------- | --- |
| A    | `shopease`     | YOUR_VPS_IP | 300 |
| A    | `api.shopease` | YOUR_VPS_IP | 300 |
| A    | `coolify`      | YOUR_VPS_IP | 300 |

For example, if your domain is `YOUR_DOMAIN`, these records will create:

- `shopease.YOUR_DOMAIN` — the Next.js frontend
- `api.shopease.YOUR_DOMAIN` — the Express.js backend API
- `coolify.YOUR_DOMAIN` — the Coolify dashboard

DNS propagation usually takes 1 to 5 minutes. You can verify that your records are active by running:

```bash
dig shopease.YOUR_DOMAIN +short
```

You should see your VPS IP address in the output.

## Step 4 — Connecting GitHub to Coolify

In this step, you will create a GitHub App that connects Coolify to your repositories. This enables automatic deployments whenever you push to the `main` branch.

### Forking the Repositories

If you have not already, fork both project repositories to your GitHub account or organization:

- [strettch-cloud/coolify-express-api](https://github.com/strettch-cloud/coolify-express-api)
- [strettch-cloud/coolify-nextjs-store](https://github.com/strettch-cloud/coolify-nextjs-store)

### Creating the GitHub App

1. In Coolify, click **Sources** in the left sidebar.
2. Click **+ Add**.
3. Select **GitHub**.
4. Fill in the form:
   - **Name:** A descriptive name for the app (for example, `my-coolify`)
   - **Organization (on GitHub):** Your GitHub organization name. Leave empty to use your personal account.
5. Click **Continue**. Coolify redirects you to GitHub.
6. On the GitHub page, click **Create GitHub App for [your-org]**.

### Installing the GitHub App

7. After creation, GitHub prompts you to install the app. Click **Install**.
8. Select **Only select repositories** and choose both:
   - `coolify-express-api`
   - `coolify-nextjs-store`
9. Click **Install**.

You will be redirected back to Coolify. The GitHub source now appears under **Sources** with a connected status.

> **Note:** If you need to grant access to additional repositories later, you can manage the GitHub App installation at `https://github.com/settings/installations`.

## Step 5 — Deploying MongoDB

In this step, you will deploy a MongoDB database inside Coolify. The backend API will connect to this database using an internal Docker network URL.

1. Navigate to **My first project → production** and click **+ New**.
2. Search for `mongodb` and select **MongoDB** under the Databases section.

Coolify creates the database with auto-generated credentials. On the configuration page, you will see:

- **Image:** `mongo:7`
- **Username:** `root` (auto-generated)
- **Password:** A randomly generated string
- **Mongo URL (internal):** A connection string similar to:

  ```
  mongodb://root:GENERATED_PASSWORD@CONTAINER_ID:27017/?directConnection=true
  ```

3. Copy the **Mongo URL (internal)** value. You will need it in Step 6.
4. Click **Start** to launch MongoDB.

Wait until the status changes to **Running (healthy)** before proceeding.

> **Note:** The internal URL uses a Docker container hostname, not `localhost`. This is how services communicate within the Coolify Docker network.

## Step 6 — Deploying the Express.js Backend

In this step, you will deploy the Express.js API, configure its environment variables, and seed the database with sample product data.

### Adding the Application

1. Navigate to **My first project → production** and click **+ New**.
2. Select **Private Repository (with GitHub App)**.
3. Choose your connected GitHub App from the list.
4. Select the `coolify-express-api` repository.
5. Select the `main` branch.
6. Set **Build Pack** to **Dockerfile**.
7. Click **Continue**.

### Configuring the Domain

On the configuration page, update the following settings under **General**:

- **Name:** `shopease-api`
- **Domain:** `https://api.shopease.YOUR_DOMAIN`
- **Ports Exposes:** `5000`

> **Warning:** The Domain field **must** include the `https://` prefix. For example, enter `https://api.shopease.YOUR_DOMAIN` — not `api.shopease.YOUR_DOMAIN`. If you omit the protocol, Traefik will fail to route traffic to your application. You will see "404 page not found" errors, and SSL will not be provisioned. This is the single most common deployment mistake with Coolify.

Click **Save**.

### Setting Environment Variables

1. Go to the **Environment Variables** tab.
2. Click **Developer view**.
3. Paste the following variables:

```env
MONGODB_URI=mongodb://root:GENERATED_PASSWORD@CONTAINER_ID:27017/shopease?authSource=admin&directConnection=true
JWT_SECRET=your-secret-key-change-this-to-something-random
PORT=5000
FRONTEND_URL=https://shopease.YOUR_DOMAIN
```

4. Click **Save All Environment Variables**.

> **Note:** The `MONGODB_URI` value requires modification from the internal URL you copied in Step 5. Take the original URL and make two changes: add `/shopease` after the port number to specify the database name, and replace the query string with `?authSource=admin&directConnection=true`. For example, if the internal URL is `mongodb://root:abc123@n58y4pvy:27017/?directConnection=true`, change it to `mongodb://root:abc123@n58y4pvy:27017/shopease?authSource=admin&directConnection=true`.

### Deploying

Click the **Deploy** button. Coolify will clone the repository, build the Docker image, start the container, configure Traefik routing, and provision an SSL certificate via Let's Encrypt. This process takes approximately 30 seconds.

Once the deployment succeeds, verify the API is running:

```bash
curl https://api.shopease.YOUR_DOMAIN/api/health
```

You should see:

```
{"status":"ok","service":"shopease-api"}
```

### Seeding the Database

The backend includes a seed script that populates the database with 10 sample products. To run it, go to the **Terminal** tab for `shopease-api` in Coolify and execute:

```bash
node src/seed.js
```

Alternatively, you can run it via SSH:

```bash
# Find the backend container name
docker ps --format '{{.Names}}' | grep -v coolify | grep -v mongo

# Run the seed script
docker exec CONTAINER_NAME node src/seed.js
```

You should see output like:

```
Connected to MongoDB
Cleared existing products
Seeded 10 products
Done!
```

Verify that the products are available:

```bash
curl https://api.shopease.YOUR_DOMAIN/api/products
```

## Step 7 — Deploying the Next.js Frontend

In this step, you will deploy the Next.js storefront and connect it to the backend API using a build-time environment variable.

### Adding the Application

1. Navigate to **My first project → production** and click **+ New**.
2. Select **Private Repository (with GitHub App)**.
3. Choose your GitHub App, then select the `coolify-nextjs-store` repository.
4. Select the `main` branch.
5. Set **Build Pack** to **Dockerfile**.
6. Click **Continue**.

### Configuring the Domain

On the configuration page, update the following settings under **General**:

- **Name:** `shopease-store`
- **Domain:** `https://shopease.YOUR_DOMAIN`
- **Ports Exposes:** `3000`

> **Warning:** As with the backend, the Domain field **must** include `https://`. Enter `https://shopease.YOUR_DOMAIN` — not `shopease.YOUR_DOMAIN`. Omitting the protocol will break Traefik routing and prevent SSL provisioning.

Click **Save**.

### Setting Environment Variables

1. Go to the **Environment Variables** tab.
2. Click **Developer view**.
3. Add the following variable:

```env
NEXT_PUBLIC_API_URL=https://api.shopease.YOUR_DOMAIN
```

4. Click **Save All Environment Variables**.
5. Switch to **Normal view** and verify that `NEXT_PUBLIC_API_URL` has the **Available at Buildtime** checkbox enabled.

> **Note:** The `NEXT_PUBLIC_API_URL` variable must be available at build time because the Dockerfile uses `ARG NEXT_PUBLIC_API_URL` to inject the API URL during the Next.js build process. Coolify enables this by default, but you should confirm it is checked. If you change this value later, you must **redeploy** (not just restart) the application for the change to take effect.

### Deploying

Click **Deploy**. The Next.js build is more resource-intensive than the backend and takes 1 to 2 minutes. It installs dependencies, compiles all pages, generates static content, and creates a standalone production image.

> **Note:** If the build fails with exit code 255, this is typically a transient Docker BuildKit issue. Click **Redeploy** to try again. If the error persists, clear the Docker build cache via SSH:
>
> ```bash
> docker builder prune -f
> ```

Once deployed, visit `https://shopease.YOUR_DOMAIN` in your browser. You should see the ShopEase storefront displaying all 10 products.

## Step 8 — Testing the Application

In this step, you will verify that the full application works end-to-end, test API endpoints directly, and confirm that auto-deploy is functional.

### Testing the User Flow

Walk through the complete storefront experience:

1. **Browse products** — Visit the homepage and use the category filters.
2. **View a product** — Click any product card to see its detail page.
3. **Add to cart** — Click "Add to cart" on a product.
4. **View cart** — Navigate to the cart page and adjust quantities.
5. **Register** — Create an account with any email and a password of at least 6 characters.
6. **Checkout** — Enter a shipping address and place the order.
7. **View orders** — Check your order history page.

### Testing API Endpoints

Use `curl` to verify the backend API directly:

```bash
# Health check
curl https://api.shopease.YOUR_DOMAIN/api/health

# Get all products
curl https://api.shopease.YOUR_DOMAIN/api/products

# Filter products by category
curl https://api.shopease.YOUR_DOMAIN/api/products?category=Electronics

# Register a new user
curl -X POST https://api.shopease.YOUR_DOMAIN/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "password123"}'

# Log in
curl -X POST https://api.shopease.YOUR_DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Testing Auto-Deploy

Since you connected GitHub via a GitHub App in Step 4, any push to the `main` branch triggers an automatic deployment. To test this:

1. Make a small change in one of your forked repositories (for example, update a product name in `src/seed.js`).
2. Commit and push the change to `main`.
3. In Coolify, navigate to your application and open the **Deployments** tab.
4. You should see a new deployment triggered automatically within a few seconds.

## Conclusion

You have successfully deployed a full-stack ecommerce application on Strettch Cloud using Coolify. Your setup includes:

- A **Strettch Cloud VPS** running Ubuntu 24.04 with Coolify installed
- A **MongoDB** database accessible only through the internal Docker network
- An **Express.js** backend API with JWT authentication, seeded with sample data
- A **Next.js** frontend storefront connected to the API
- **Automatic SSL** certificates provisioned by Traefik via Let's Encrypt
- **Auto-deploy on push** through the GitHub App integration

From here, you can explore additional Coolify features such as [database backups](https://coolify.io/docs), built-in monitoring and metrics, or preview deployments for pull request branches. You can also extend ShopEase with features like product search, reviews, an admin panel, or payment integration.

For more information, refer to the following resources:

- [Strettch Cloud](https://cloud.strettch.com)
- [Coolify Documentation](https://coolify.io/docs)
- [Frontend Source Code](https://github.com/strettch-cloud/coolify-nextjs-store)
- [Backend Source Code](https://github.com/strettch-cloud/coolify-express-api)
- [Live Demo](https://shopease.strettchcloud.com)

## FAQs

**Q: Why do I need 4 GB of RAM? Can I use a smaller server?**

Coolify itself consumes approximately 1.5 GB of RAM. The Next.js Docker build process is memory-intensive and requires additional headroom. With only 2 GB of RAM, builds are likely to fail with out-of-memory errors. A server with 2 vCPUs and 4 GB of RAM is the recommended minimum for this stack.

**Q: Why does the Domain field in Coolify require the `https://` prefix?**

Coolify uses the protocol in the Domain field to configure Traefik routing rules and SSL certificate provisioning. When you include `https://`, Traefik knows to request a Let's Encrypt certificate and terminate TLS. Without it, Traefik cannot route traffic correctly, resulting in "404 page not found" errors.

**Q: I changed `NEXT_PUBLIC_API_URL` but the frontend still points to the old URL. What happened?**

Next.js bakes `NEXT_PUBLIC_` environment variables into the JavaScript bundle at build time. Restarting the container does not update these values. You must trigger a full **Redeploy** from the Coolify dashboard so that Next.js rebuilds with the new value.

**Q: Can I use a different database instead of MongoDB?**

Yes. Coolify supports PostgreSQL, MySQL, MariaDB, and Redis out of the box. However, the ShopEase backend is built with Mongoose (a MongoDB ODM), so switching databases would require rewriting the data layer.

**Q: How do I set up automatic database backups?**

In Coolify, navigate to your MongoDB resource and open the **Backups** tab. You can configure scheduled backups to local storage or an S3-compatible object storage provider. Refer to the [Coolify documentation](https://coolify.io/docs) for detailed backup configuration instructions.

**Q: The build failed with exit code 255. What should I do?**

This is typically a transient Docker BuildKit error. Click **Redeploy** in Coolify to retry. If the error persists, SSH into your server and clear the build cache with `docker builder prune -f`, then redeploy from the Coolify dashboard.
