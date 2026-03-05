# AI Exercise Chat App

## Overview
The AI Exercise Chat App is a web-based application designed to provide personalized exercise outcomes based on user inputs. Users can input their Body Mass Index (BMI), current body condition, exercise preferences, and available tools for home workouts. The app utilizes AI to generate tailored workout suggestions and outcomes.

## Features
- **User Input**: Collects user data including BMI, body condition, exercise preferences, and available equipment.
- **AI-Generated Outcomes**: Provides personalized exercise recommendations based on user inputs.
- **Chat Interface**: Engaging chat system for user interaction and feedback.
- **Responsive Design**: Optimized for various devices and screen sizes.

## Project Structure
```
ai-exercise-chat-app
├── src
│   ├── index.html          # Main HTML document
│   ├── styles
│   │   └── main.css       # Styles for the web page
│   ├── scripts
│   │   ├── app.js         # Main JavaScript file
│   │   ├── chat.js        # Chat functionality
│   │   ├── bmi.js         # BMI calculation functions
│   │   └── outcomes.js     # Exercise outcomes generation
│   └── data
│       └── exercises.json  # Exercise programs data
├── package.json            # npm configuration file
├── .env.example            # Environment variables template
└── README.md               # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd ai-exercise-chat-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Start the application:
   ```
   npm start
   ```
2. Open your web browser and go to `http://127.0.0.1:8080` (live-server default) to access the chat interface.

## Supabase Setup
1. Open `src/scripts/supabase-config.js`.
2. Set your keys:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (publishable key only)
3. Create tables in Supabase SQL Editor using `supabase/schema.sql`.
4. Keep service role keys on backend only. Do not expose secret keys in frontend files.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.