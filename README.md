# LuminaFlowAI

LuminaFlowAI is a powerful web application that leverages artificial intelligence to generate video scripts, images, and audio for content creators. This tool streamlines the video creation process by automating various aspects of content generation.

## Features

- Generate video scripts using AI models (OpenAI GPT, Anthropic Claude)
- Create AI-generated images for video content (DALL-E, Leonardo AI, Stability AI)
- Generate audio narration using text-to-speech AI models
- Customizable video sections with editable titles and content
- Support for multiple AI providers and models
- Secure storage of API keys in the browser's local storage
- Export and import project configurations
- History management for past generations
- Dark mode and responsive design

## How to Install

To get started with LuminaFlowAI, follow these steps:

1. Ensure you have [Node.js](https://nodejs.org/) (version 14 or later) and [npm](https://www.npmjs.com/) installed on your system.

2. Open your terminal or command prompt.

3. Run the following commands:

   \`\`\`bash
   # Clone the repository
   git clone https://github.com/yourusername/LuminaFlowAI.git

   # Navigate to the project directory
   cd LuminaFlowAI

   # Install dependencies
   npm install

   # Start the development server
   npm run dev
   \`\`\`

4. Open your web browser and visit `http://localhost:3000` to use the application.

## Installation

For detailed installation instructions, please refer to the [How to Install](#how-to-install) section above.

Remember to set up your environment variables by creating a `.env.local` file in the root directory with your API keys:

\`\`\`env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
LEONARDO_API_KEY=your_leonardo_api_key
STABILITY_API_KEY=your_stability_api_key
\`\`\`

