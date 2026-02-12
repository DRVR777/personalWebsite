#!/bin/bash

# Configuration
REPO_NAME="DRVR777/personalWebsite"
PROJECT_DIR="/root/personalWebsite"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting GitHub Deployment...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR" || exit

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: gh CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check authentication status
echo -e "${YELLOW}Checking GitHub authentication...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You are not logged in. Initiating login...${NC}"
    echo "Please select 'GitHub.com', 'HTTPS', and 'Login with a web browser'."
    gh auth login
else
    echo -e "${GREEN}Already authenticated!${NC}"
fi

# Check again after login attempt
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Authentication failed. Please try again.${NC}"
    exit 1
fi

# Create remote repository if it doesn't exist
echo -e "${YELLOW}Creating remote repository: $REPO_NAME${NC}"
if gh repo view "$REPO_NAME" &> /dev/null; then
    echo -e "${YELLOW}Repository already exists. configuring remote...${NC}"
    if ! git remote | grep -q origin; then
        git remote add origin "https://github.com/$REPO_NAME.git"
    fi
else
    gh repo create "$REPO_NAME" --public --source=. --remote=origin
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Repository created successfully!${NC}"
    else
        echo -e "${RED}Failed to create repository.${NC}"
        exit 1
    fi
fi

# Push code
echo -e "${YELLOW}Pushing code to GitHub...${NC}"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Success! Your website is live at: https://github.com/$REPO_NAME${NC}"
    echo -e "${GREEN}Deployment complete!${NC}"
else
    echo -e "${RED}Failed to push code. Please check for errors above.${NC}"
    exit 1
fi
