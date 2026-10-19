.PHONY: all build run test test-race cover lint docker-build clean

all: build

build:
	go build -v -o bin/server .

run:
	go run .

test:
	go test -v -count=1 ./...

test-race:
	go test -v -race -count=1 ./...

cover:
	go test -coverprofile=coverage.out -covermode=atomic ./...
	go tool cover -func=coverage.out

lint:
	gofmt -s -w .
	golangci-lint run ./... || true

docker-build:
	docker build -t eps-dashboard-backend:latest .

clean:
	rm -rf bin/ coverage.out

