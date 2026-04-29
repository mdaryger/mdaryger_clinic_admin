SHELL := /bin/sh

FIREBASE_PROJECT := medicall-prod-35394
FIREBASE_HOSTING_SITE := clinics-mdaryger
FIREBASE := npx firebase

.PHONY: help install dev prod lint build build-dev start preview deploy deploy-hosting clean

help:
	@printf "\nClinics Admin commands:\n\n"
	@printf "  make install   Install project dependencies\n"
	@printf "  make dev       Run the app with dev Firebase\n"
	@printf "  make prod      Run the app with prod Firebase\n"
	@printf "  make lint      Run ESLint\n"
	@printf "  make build     Create the production build with prod Firebase\n"
	@printf "  make build-dev Create a build with dev Firebase\n"
	@printf "  make start     Run Vite preview server locally\n"
	@printf "  make preview   Run lint + build for a production check\n"
	@printf "  make deploy    Build in prod mode and deploy to Firebase Hosting\n"
	@printf "  make deploy-hosting Deploy the existing dist/ build to Firebase Hosting\n"
	@printf "  make clean     Remove generated build output\n\n"

install:
	npm install

dev:
	npm run dev

prod:
	npm run dev:prod

lint:
	npm run lint

build:
	npm run build

build-dev:
	npm run build:dev

start:
	npm run preview

preview: lint build

deploy: build deploy-hosting

deploy-hosting:
	$(FIREBASE) use $(FIREBASE_PROJECT)
	$(FIREBASE) deploy --only hosting:$(FIREBASE_HOSTING_SITE)

clean:
	rm -rf dist
