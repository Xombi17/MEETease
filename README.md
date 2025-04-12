# MEETease

A web application that helps two or more people find an ideal, mutually convenient meeting point on a map. The app simplifies the process of coordination when individuals are coming from different locations and want to meet at a common point before heading to a final destination together.

## Features

- Input current locations for multiple users
- Calculate optimal meeting points based on all users' locations
- Navigation and directions to the meeting point
- Optional final destination integration
- Real-time tracking (optional)
- Support for multiple users

## Setup

1. Clone the repository
2. Install dependencies
   ```
   bun install
   ```
3. Create a `.env` file in the root directory based on `.env.example`
4. Add your Google Maps API key to the `.env` file
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
5. Run the development server
   ```
   bun run dev
   ```

## Environment Variables

- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key (required for map functionality)

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Google Maps API
- Framer Motion
- Bun
