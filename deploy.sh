#!/bin/bash
set -e

# ============================================================
# ShopEase Deployment Script for Strettch Cloud + Coolify
# ============================================================
# This script automates the deployment of the ShopEase ecommerce
# application on a VPS using Coolify v4.
#
# Prerequisites:
#   - A fresh Ubuntu VPS (22.04+) with root/sudo access
#   - A domain with DNS A records pointing to this VPS:
#     - shopease.strettchcloud.com    → VPS IP
#     - api.shopease.strettchcloud.com → VPS IP
#     - coolify.strettchcloud.com      → VPS IP
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/strettch/coolify-nextjs-store/main/deploy.sh | bash
#   # OR
#   chmod +x deploy.sh && ./deploy.sh
# ============================================================

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() { echo -e "${CYAN}[ShopEase]${NC} $1"; }
success() { echo -e "${GREEN}[ShopEase]${NC} $1"; }
warn() { echo -e "${YELLOW}[ShopEase]${NC} $1"; }
error() { echo -e "${RED}[ShopEase]${NC} $1"; }

# ============================================================
# Step 1: Install Coolify
# ============================================================
log "Step 1: Installing Coolify v4..."

if command -v docker &> /dev/null && docker ps | grep -q coolify; then
    success "Coolify is already installed and running!"
else
    log "Downloading and running Coolify installer..."
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

    log "Waiting for Coolify to start..."
    sleep 30

    # Wait until Coolify is responsive
    RETRIES=20
    until curl -sf http://localhost:8000 > /dev/null 2>&1; do
        RETRIES=$((RETRIES - 1))
        if [ $RETRIES -le 0 ]; then
            error "Coolify didn't start in time. Check: docker ps"
            exit 1
        fi
        log "Waiting for Coolify... ($RETRIES attempts left)"
        sleep 10
    done
    success "Coolify is up and running!"
fi

# ============================================================
# Step 2: Get API Token from user
# ============================================================
echo ""
echo "============================================================"
warn "ACTION REQUIRED: Set up Coolify and get your API token"
echo "============================================================"
echo ""
echo "1. Open your browser and go to: http://<YOUR_VPS_IP>:8000"
echo "   (or https://coolify.strettchcloud.com if DNS is set up)"
echo ""
echo "2. Create your admin account (first-time setup)"
echo ""
echo "3. Go to: Keys & Tokens → API Tokens"
echo "   Create a new token with ALL permissions (read, write, deploy)"
echo ""
echo "4. Paste your API token below:"
echo ""

read -rp "API Token: " COOLIFY_TOKEN

if [ -z "$COOLIFY_TOKEN" ]; then
    error "API token is required!"
    exit 1
fi

COOLIFY_URL="http://localhost:8000"

# Validate token
if ! curl -sf "$COOLIFY_URL/api/v1/teams" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" > /dev/null 2>&1; then
    error "Invalid API token. Please check and try again."
    exit 1
fi
success "API token is valid!"

# ============================================================
# Step 3: Get server and destination UUIDs
# ============================================================
log "Step 3: Fetching server info..."

SERVER_UUID=$(curl -sf "$COOLIFY_URL/api/v1/servers" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" | \
    python3 -c "import sys,json; servers=json.load(sys.stdin); print(servers[0]['uuid'])")

log "Server UUID: $SERVER_UUID"

# Get the default docker destination
DESTINATION_UUID=$(curl -sf "$COOLIFY_URL/api/v1/servers/$SERVER_UUID/resources" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
# Try to find a standalone docker destination
for item in data:
    if 'destination' in str(type(item)).lower() or isinstance(item, dict):
        if 'uuid' in item:
            print(item['uuid'])
            sys.exit(0)
print('')
" 2>/dev/null || echo "")

# If we couldn't get destination from resources, try destinations endpoint
if [ -z "$DESTINATION_UUID" ]; then
    DESTINATION_UUID=$(curl -sf "$COOLIFY_URL/api/v1/servers/$SERVER_UUID" \
        -H "Authorization: Bearer $COOLIFY_TOKEN" \
        -H "Content-Type: application/json" | \
        python3 -c "
import sys, json
data = json.load(sys.stdin)
settings = data.get('settings', {})
# Try common fields
for key in ['destination_uuid', 'docker_network']:
    if key in data:
        print(data[key])
        sys.exit(0)
# Check for destinations in settings
if 'destinations' in data:
    dests = data['destinations']
    if isinstance(dests, list) and len(dests) > 0:
        print(dests[0].get('uuid', ''))
        sys.exit(0)
print('')
" 2>/dev/null || echo "")
fi

if [ -z "$DESTINATION_UUID" ]; then
    warn "Could not auto-detect destination UUID."
    echo "You can find it in Coolify UI → Servers → your server → Destinations"
    read -rp "Destination UUID: " DESTINATION_UUID
fi

log "Destination UUID: $DESTINATION_UUID"

# ============================================================
# Step 4: Create the ShopEase project
# ============================================================
log "Step 4: Creating ShopEase project..."

PROJECT_RESPONSE=$(curl -sf "$COOLIFY_URL/api/v1/projects" \
    -X POST \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"ShopEase","description":"Full-stack ecommerce demo — Next.js + Express + MongoDB"}')

PROJECT_UUID=$(echo "$PROJECT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['uuid'])")
success "Project created: $PROJECT_UUID"

# ============================================================
# Step 5: Deploy MongoDB
# ============================================================
log "Step 5: Deploying MongoDB..."

MONGO_RESPONSE=$(curl -sf "$COOLIFY_URL/api/v1/databases/mongodb" \
    -X POST \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"shopease-mongodb\",
        \"project_uuid\": \"$PROJECT_UUID\",
        \"environment_name\": \"production\",
        \"server_uuid\": \"$SERVER_UUID\",
        \"destination_uuid\": \"$DESTINATION_UUID\",
        \"instant_deploy\": true
    }")

MONGO_UUID=$(echo "$MONGO_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['uuid'])")
success "MongoDB deployed: $MONGO_UUID"

# Wait for MongoDB to be ready
log "Waiting for MongoDB to be ready..."
sleep 20

# Get MongoDB internal URL
MONGO_INTERNAL_URL=$(curl -sf "$COOLIFY_URL/api/v1/databases/$MONGO_UUID" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
# Build the internal connection string
host = data.get('internal_db_url', '')
if host:
    print(host)
else:
    # Fallback: construct from fields
    user = data.get('mongo_initdb_root_username', 'root')
    password = data.get('mongo_initdb_root_password', '')
    port = data.get('internal_port', 27017)
    name = data.get('name', 'shopease-mongodb')
    # Internal Docker network hostname is the container name
    print(f'mongodb://{user}:{password}@{name}:{port}/shopease?authSource=admin')
")

if [ -z "$MONGO_INTERNAL_URL" ]; then
    warn "Could not auto-detect MongoDB URL."
    echo "Check Coolify dashboard for the MongoDB connection string."
    read -rp "MongoDB URI: " MONGO_INTERNAL_URL
fi

log "MongoDB URI: $MONGO_INTERNAL_URL"

# ============================================================
# Step 6: Deploy Express API (Backend)
# ============================================================
log "Step 6: Deploying ShopEase API (Express.js)..."

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -hex 32)

API_RESPONSE=$(curl -sf "$COOLIFY_URL/api/v1/applications/public" \
    -X POST \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"shopease-api\",
        \"description\": \"ShopEase Express.js API\",
        \"project_uuid\": \"$PROJECT_UUID\",
        \"environment_name\": \"production\",
        \"server_uuid\": \"$SERVER_UUID\",
        \"destination_uuid\": \"$DESTINATION_UUID\",
        \"git_repository\": \"https://github.com/strettch/coolify-express-api\",
        \"git_branch\": \"main\",
        \"ports_exposes\": \"5000\",
        \"build_pack\": \"dockerfile\",
        \"instant_deploy\": false
    }")

API_UUID=$(echo "$API_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['uuid'])")
success "API application created: $API_UUID"

# Set environment variables for the API
log "Setting API environment variables..."
curl -sf "$COOLIFY_URL/api/v1/applications/$API_UUID/envs/bulk" \
    -X PATCH \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"envs\": [
            {\"key\": \"MONGODB_URI\", \"value\": \"$MONGO_INTERNAL_URL\", \"is_build_time\": false},
            {\"key\": \"JWT_SECRET\", \"value\": \"$JWT_SECRET\", \"is_build_time\": false},
            {\"key\": \"PORT\", \"value\": \"5000\", \"is_build_time\": false},
            {\"key\": \"FRONTEND_URL\", \"value\": \"https://shopease.strettchcloud.com\", \"is_build_time\": false}
        ]
    }" > /dev/null

# Configure domain
log "Configuring API domain: api.shopease.strettchcloud.com"
curl -sf "$COOLIFY_URL/api/v1/applications/$API_UUID" \
    -X PATCH \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"fqdn\": \"https://api.shopease.strettchcloud.com\"}" > /dev/null

# Deploy the API
log "Deploying API..."
curl -sf "$COOLIFY_URL/api/v1/deploy" \
    -X POST \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"uuid\": \"$API_UUID\"}" > /dev/null

success "API deployment triggered!"

# ============================================================
# Step 7: Deploy Next.js Frontend
# ============================================================
log "Step 7: Deploying ShopEase Store (Next.js)..."

FRONTEND_RESPONSE=$(curl -sf "$COOLIFY_URL/api/v1/applications/public" \
    -X POST \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"shopease-store\",
        \"description\": \"ShopEase Next.js Frontend\",
        \"project_uuid\": \"$PROJECT_UUID\",
        \"environment_name\": \"production\",
        \"server_uuid\": \"$SERVER_UUID\",
        \"destination_uuid\": \"$DESTINATION_UUID\",
        \"git_repository\": \"https://github.com/strettch/coolify-nextjs-store\",
        \"git_branch\": \"main\",
        \"ports_exposes\": \"3000\",
        \"build_pack\": \"dockerfile\",
        \"instant_deploy\": false
    }")

FRONTEND_UUID=$(echo "$FRONTEND_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['uuid'])")
success "Frontend application created: $FRONTEND_UUID"

# Set environment variables for the frontend
log "Setting frontend environment variables..."
curl -sf "$COOLIFY_URL/api/v1/applications/$FRONTEND_UUID/envs/bulk" \
    -X PATCH \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"envs\": [
            {\"key\": \"NEXT_PUBLIC_API_URL\", \"value\": \"https://api.shopease.strettchcloud.com\", \"is_build_time\": true}
        ]
    }" > /dev/null

# Configure domain
log "Configuring frontend domain: shopease.strettchcloud.com"
curl -sf "$COOLIFY_URL/api/v1/applications/$FRONTEND_UUID" \
    -X PATCH \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"fqdn\": \"https://shopease.strettchcloud.com\"}" > /dev/null

# Deploy the frontend
log "Deploying frontend..."
curl -sf "$COOLIFY_URL/api/v1/deploy" \
    -X POST \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"uuid\": \"$FRONTEND_UUID\"}" > /dev/null

success "Frontend deployment triggered!"

# ============================================================
# Step 8: Seed the database
# ============================================================
log "Step 8: Waiting for API to be ready before seeding..."
sleep 60

log "Seeding database with sample products..."
# The seed runs inside the API container
API_CONTAINER=$(docker ps --filter "name=shopease-api" --format '{{.Names}}' | head -1)
if [ -n "$API_CONTAINER" ]; then
    docker exec "$API_CONTAINER" node src/seed.js
    success "Database seeded with sample products!"
else
    warn "Could not find API container for seeding."
    echo "You can seed manually later by running:"
    echo "  docker exec \$(docker ps --filter 'name=shopease-api' -q) node src/seed.js"
fi

# ============================================================
# Done!
# ============================================================
echo ""
echo "============================================================"
success "ShopEase deployment complete!"
echo "============================================================"
echo ""
echo "  Frontend:  https://shopease.strettchcloud.com"
echo "  API:       https://api.shopease.strettchcloud.com"
echo "  Coolify:   https://coolify.strettchcloud.com"
echo ""
echo "  MongoDB UUID:  $MONGO_UUID"
echo "  API UUID:      $API_UUID"
echo "  Frontend UUID: $FRONTEND_UUID"
echo "  JWT Secret:    $JWT_SECRET"
echo ""
echo "  Note: Deployments may take a few minutes to complete."
echo "  Check progress in the Coolify dashboard."
echo ""
echo "============================================================"
