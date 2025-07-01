#!/bin/bash

# MentalSpace EHR Docker Setup Script
set -e

echo "🚀 Setting up MentalSpace EHR Development Environment with Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if ports are available
check_ports() {
    print_status "Checking if required ports are available..."
    
    local ports=("3000" "5432" "5050" "6379" "8025")
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port is already in use. Make sure it's not needed by another service."
        else
            print_success "Port $port is available"
        fi
    done
}

# Create environment file if it doesn't exist
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp env.example .env
        print_success "Created .env file"
    else
        print_warning ".env file already exists. Skipping creation."
    fi
}

# Build and start containers
start_containers() {
    print_status "Building and starting Docker containers..."
    
    # Stop any existing containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Build and start containers
    docker-compose up --build -d
    
    print_success "Containers started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    timeout=60
    counter=0
    while ! docker-compose exec -T postgres pg_isready -U postgres -d mentalspace_ehr >/dev/null 2>&1; do
        sleep 1
        counter=$((counter + 1))
        if [ $counter -ge $timeout ]; then
            print_error "PostgreSQL failed to start within $timeout seconds"
            exit 1
        fi
    done
    print_success "PostgreSQL is ready"
    
    # Wait for Node.js app
    print_status "Waiting for Node.js application..."
    timeout=120
    counter=0
    while ! curl -f http://localhost:3000/health >/dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "Node.js application failed to start within $timeout seconds"
            exit 1
        fi
    done
    print_success "Node.js application is ready"
}

# Display service information
show_service_info() {
    echo ""
    print_success "🎉 MentalSpace EHR Development Environment is ready!"
    echo ""
    echo "📋 Service Information:"
    echo "  • Node.js App:     http://localhost:3000"
    echo "  • Health Check:    http://localhost:3000/health"
    echo "  • PostgreSQL:      localhost:5432"
    echo "  • pgAdmin:         http://localhost:5050"
    echo "  • Redis:           localhost:6379"
    echo "  • MailHog:         http://localhost:8025"
    echo ""
    echo "🔐 Sample Login Credentials:"
    echo "  • Admin:           admin@mentalspace.com / admin123"
    echo "  • Therapist:       dr.smith@mentalspace.com / therapist123"
    echo "  • Client:          john.doe@example.com / client123"
    echo ""
    echo "📚 Useful Commands:"
    echo "  • View logs:       docker-compose logs -f"
    echo "  • Stop services:   docker-compose down"
    echo "  • Restart app:     docker-compose restart app"
    echo "  • Access database: docker-compose exec postgres psql -U postgres -d mentalspace_ehr"
    echo ""
}

# Main execution
main() {
    echo "🧠 MentalSpace EHR Docker Setup"
    echo "================================"
    echo ""
    
    check_docker
    check_ports
    setup_environment
    start_containers
    wait_for_services
    show_service_info
}

# Run main function
main "$@" 