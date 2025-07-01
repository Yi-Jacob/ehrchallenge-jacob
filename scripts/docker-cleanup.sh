#!/bin/bash

# MentalSpace EHR Docker Cleanup Script
set -e

echo "🧹 Cleaning up MentalSpace EHR Docker Environment..."

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

# Stop and remove containers
cleanup_containers() {
    print_status "Stopping and removing containers..."
    
    # Stop all containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Remove any dangling containers
    docker container prune -f 2>/dev/null || true
    
    print_success "Containers cleaned up"
}

# Remove volumes (optional)
cleanup_volumes() {
    read -p "Do you want to remove all volumes? This will delete all data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing volumes..."
        
        # Remove volumes
        docker volume rm mentalspace-ehr-challenge_postgres_data 2>/dev/null || true
        docker volume rm mentalspace-ehr-challenge_pgadmin_data 2>/dev/null || true
        docker volume rm mentalspace-ehr-challenge_redis_data 2>/dev/null || true
        
        # Remove any dangling volumes
        docker volume prune -f 2>/dev/null || true
        
        print_success "Volumes removed"
    else
        print_status "Skipping volume removal"
    fi
}

# Remove images (optional)
cleanup_images() {
    read -p "Do you want to remove Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing Docker images..."
        
        # Remove images
        docker rmi mentalspace-ehr-challenge_app 2>/dev/null || true
        docker rmi mentalspace-ehr-challenge_app_dev 2>/dev/null || true
        
        # Remove any dangling images
        docker image prune -f 2>/dev/null || true
        
        print_success "Images removed"
    else
        print_status "Skipping image removal"
    fi
}

# Clean up networks
cleanup_networks() {
    print_status "Cleaning up networks..."
    
    # Remove networks
    docker network rm mentalspace-ehr-challenge_mentalspace-network 2>/dev/null || true
    
    # Remove any dangling networks
    docker network prune -f 2>/dev/null || true
    
    print_success "Networks cleaned up"
}

# Show cleanup summary
show_cleanup_summary() {
    echo ""
    print_success "🎉 Docker environment cleanup completed!"
    echo ""
    echo "📋 Cleanup Summary:"
    echo "  • Containers: Stopped and removed"
    echo "  • Networks: Cleaned up"
    echo "  • Volumes: $(if [[ $REPLY =~ ^[Yy]$ ]]; then echo "Removed"; else echo "Preserved"; fi)"
    echo "  • Images: $(if [[ $REPLY =~ ^[Yy]$ ]]; then echo "Removed"; else echo "Preserved"; fi)"
    echo ""
    echo "📚 To start fresh:"
    echo "  • Run: ./scripts/docker-setup.sh"
    echo "  • Or: docker-compose up --build"
    echo ""
}

# Main execution
main() {
    echo "🧠 MentalSpace EHR Docker Cleanup"
    echo "=================================="
    echo ""
    
    cleanup_containers
    cleanup_networks
    cleanup_volumes
    cleanup_images
    show_cleanup_summary
}

# Run main function
main "$@" 