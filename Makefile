# Makefile for LeetCode Visualizer

.PHONY: install dev build deploy clean help

help:
	@echo "Available commands:"
	@echo "  make install  - Install dependencies for Frontend and API"
	@echo "  make dev      - Start the local development server (Frontend + Backend)"
	@echo "  make build    - Build the Frontend for production"
	@echo "  make deploy   - Deploy to Vercel"
	@echo "  make clean    - Remove build artifacts and node_modules"

install:
	@echo "Installing Root dependencies..."
	npm install
	@echo "Installing Frontend dependencies..."
	cd frontend && npm install
	@echo "Installing API Node dependencies..."
	cd api && npm install
	@echo "Installing API Python dependencies..."
	cd api && pip install -r requirements.txt

dev:
	./start.sh

run-api:
	npx nodemon --exec ts-node api/index.ts

run-frontend:
	cd frontend && npm run dev

test:
	python3 validate_all.py

build:
	@echo "Building Frontend..."
	cd frontend && npm run build
	@echo "Preparing Public directory for Vercel..."
	mkdir -p public
	cp -r frontend/dist/* public/

deploy: build
	vercel deploy --prod

clean:
	rm -rf node_modules
	rm -rf frontend/node_modules frontend/dist
	rm -rf api/node_modules api/__pycache__
	rm -rf public
