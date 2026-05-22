ApartmentHunter 🏡
https://apartment-hunter-ecru.vercel.app/
ApartmentHunter is a Full-Stack MVP designed to streamline and analyze scattered apartment listings from social media. Instead of making decisions based on intuition, users can paste raw listing text to extract key data and view a personalized compatibility score based on structured filters.

🎯 Project Goal & Scope
The objective of this project was to build a functional Minimum Viable Product (MVP) to practice product characterization, prompt engineering, and full-stack architecture.

The entire codebase was generated and managed utilizing the Cursor AI Agent, acting as a development coworker. The focus was on driving development through structured requirements (PRD), system isolation, and debugging technical constraints.

⚙️ Architecture & Tech Stack
Frontend: Built with React, featuring responsive design with isolated desktop and mobile layouts. Deployed on Vercel.

Backend: Powered by FastAPI (Python) to handle API requests and business logic. Deployed on Render.

AI Core: Integrated with Gemini API using structured Prompt Engineering to parse raw text and return exact JSON objects containing parameters like price, rooms, safety shelter (Mamad), and entry dates.

Database: SQLite for local user data and apartment indexing.

Security: Implemented password encryption via Hashing, environment variables protection for API keys (.env), and backend Session Isolation to prevent data cross-contamination on demo accounts.

⚠️ Current MVP Limitations
Ephemeral Storage: The database uses SQLite on Render's free tier, meaning data resets when the server restarts or rebuilds.

Cold Start: Due to free tier hosting limits, the server goes to sleep when inactive, causing an initial ~30-second delay on the first request.

Local Media: Sample images are stored locally in static assets rather than on a dedicated image cloud provider.

🚀 Future Roadmap & Scaling
Persistent DB: Migrate from SQLite to a managed PostgreSQL instance to store persistent user data.

Cloud Storage: Connect to AWS S3 to allow live user photo uploads for apartment visits.

Performance: Upgrade hosting tiers to eliminate server spin-up delays (Cold Starts) and optimize API response times.

The live app is up, fully responsive on mobile, and features interactive demo accounts.
