<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# i-Arnold - Personal Trainer AI

This contains everything you need to run and deploy your app.

View your original app in AI Studio: https://ai.studio/apps/drive/1HGKLtsxG5Ziw20BmBASI2-lDJmyPNr98

## Run Locally

**Prerequisites:**  Node.js

1.  **Install dependencies:**
    `npm install`
2.  **Set your API Key:**
    Create a file named `.env.local` and add your Gemini API key to it:
    `GEMINI_API_KEY=YOUR_API_KEY`
3.  **Run the app:**
    `npm run dev`

Your app should now be running at `http://localhost:5173/`.

## Deployment

This project is configured for continuous deployment on Netlify.

- **Trigger:** A `git push` to the `main` branch on GitHub will automatically trigger a new deployment.
- **Configuration:** The build settings are defined in the `netlify.toml` file.
- **Environment Variables:** The `GEMINI_API_KEY` must be set in the Netlify site settings (`Site settings > Build & deploy > Environment`).
