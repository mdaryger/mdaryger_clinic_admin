SHELL := /bin/sh

.PHONY: help install dev prod lint build build-dev start preview deploy clean

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
	@printf "  make deploy    Placeholder: deploy the built app to your hosting target\n"
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

deploy:
	@printf "Deploy the contents of dist/ to your hosting target after a successful build.\n"

clean:
	rm -rf dist
