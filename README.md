# API Caching Proxy Infrastructure

This repository contains the infrastructure code for an API caching proxy server.
The server is designed to cache API responses to improve performance and reduce latency for frequently accessed data.

# Setup and Running Locally

## Prerequisites

- Node.js installed on your machine
- npm (Node Package Manager)
- An API Key from a weather service (e.g., OpenWeatherMap)

## Backend Setup (server/)

Navigate to the server directory: cd server

- Install dependencies: `npm install`
- Create a .env file in the server/ directory and populate it with your secrets:

```
# server/.env

`EXTERNAL_API_KEY="YOUR_WEATHER_API_KEY"`
`CLIENT_SECRET_TOKEN="your-client-secret-token"`
```

Run the server in development mode (using Nodemon for auto-restarts):

`npm run dev`

The server will start on http://localhost:8000.
