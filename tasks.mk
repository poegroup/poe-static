STATIC = $(wildcard src/static/*)
STATIC_FILES = $(notdir $(STATIC))
STATIC_DIRS = $(dir $(STATIC))
STATIC_TARGETS = $(addprefix build/, $(STATIC_FILES))
GIT_DEPLOY_BRANCH?=master
GIT_DEPLOY_DIR?=build

dev: .env build $(STATIC_TARGETS)
	@foreman start

build:
	@mkdir -p build

deploy: compile_static bin/deploy
	@./bin/deploy

compile_static: build $(STATIC_TARGETS)
	@echo building assets
	@foreman run make prod

build/%: src/static/%
	@cp -r $< $@

watch:
	@./node_modules/.bin/webpack --bail --output-path build --watch

bin/deploy:
	@mkdir -p bin
	@curl -o $@ https://raw.githubusercontent.com/X1011/git-directory-deploy/master/deploy.sh
	@chmod +x $@

ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

include $(ROOT_DIR)/node_modules/poe-ui/tasks.mk

.PHONY: compile_static
