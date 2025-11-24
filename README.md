# Caching Weather Client

This is a single-page, responsive application designed to provide current weather data for any specified city while demonstrating an efficient data caching strategy using Firebase Firestore. The primary goal of this project is to minimize external $\text{API}$ calls by serving recent data from a public cache, significantly improving response time and reducing costs associated with high-frequency external lookups.

## Features

- Intelligent Caching: Weather data is stored in a public Firestore cache. Subsequent requests for the same city within a 5-minute window are served instantly from the cache.
- External Data Fetch: When the cache is stale or empty, the application securely fetches the latest weather conditions from a simulated external $\text{API}$.
- User Search History: Tracks and displays a log of the user's recent searches, allowing for quick re-fetching of weather data.
- Real-time Updates: The search history log is updated in real-time using Firestore's onSnapshot listeners.
- Dynamic UI: The background changes dynamically based on the current weather conditions (e.g., sunny, rainy, thunderstorm).

## Technology Stack

This application is built as a single, self-contained React file for streamlined deployment.

Frontend: React (Functional Components & Hooks)
Language: TypeScript (for strong typing, especially for state and data structures like WeatherData).
Styling: Tailwind CSS (for utility-first, responsive design).
Database/Backend: Firebase Firestore (used for public caching and per-user search history).
Authentication: Firebase Auth (handles user authentication, setting up the required userId for Firestore access).
Asynchronicity: async/await and Promises, with useCallback and useMemo for performance optimization.

## How the Caching Logic Works

The core functionality of this application revolves around the fetchWeather function, which follows a four-step process:
Authentication Check: The function first verifies that the Firebase user is authenticated and the Firestore client (db) is ready.
Cache Lookup: It checks a public Firestore collection (/artifacts/{appId}/public/data/weather_cache/{city_name}).
If the document exists and the stored timestamp is less than 5 minutes old, the data is returned immediately with a source: 'cache' tag.

External Fetch (Cache Miss):
If the document is missing or the data is older than 5 minutes (stale), the application makes a call to the simulated external weather $\text{API}$.
If the $\text{API}$ call fails, it implements an exponential backoff retry strategy before failing completely.

Cache & History Update:
On a successful $\text{API}$ fetch, the new data and the current timestamp are written back to the public Firestore cache.
The latest result is also saved to the user's private search_history collection (/artifacts/{appId}/users/{userId}/search_history), which triggers the real-time history log update.
This architecture ensures that repeated searches for the same city rapidly return results from the secure cloud cache, significantly optimizing performance.

## Getting Started (Local Setup)

To run this project locally, you must first configure the Firebase SDK environment variables, as the application relies on Firestore for both caching and history tracking.

### 1. Prerequisites

 - Node.js (LTS version recommended)
 - npm or Yarn

2. Installation
    - Clone the repository:

        ```
        git clone [repository-url]
        cd caching-weather-client
        ```

    - Install dependencies:

        npm install
        or
        yarn install


3. Environment Configuration

    Create a file named .env.local in the root directory of the project and populate it with your Firebase configuration credentials.
    Note: These credentials are used by both the client-side React code and the server-side API routes.

    ```
    #.env.local

    REQUIRED: Your Firebase API Key
    NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy...your-api-key"

    REQUIRED: Your Firebase Project ID
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"

    REQUIRED: Your Firebase App ID (Used as the default App Name)
    NEXT_PUBLIC_FIREBASE_APP_ID="1:99999999999:web:aaaaaaaaaaaaaaaaaaaa"

    OPTIONAL: Other Firebase Config fields
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="99999999999"
    ```

4. Running the Application
    - Start the development server:
    - npm run dev or yarn dev
    - The application will be accessible at http://localhost:3000 (or the port specified by your development environment).