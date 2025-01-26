# LuminaFlowAI

LuminaFlowAI is a powerful web application that leverages artificial intelligence to generate video scripts, images, and audio for content creators. This tool streamlines the video creation process by automating various aspects of content generation.

## Features

- AI-powered video script generation using OpenAI GPT and Anthropic Claude
- Automatic image creation with DALL-E, Leonardo AI, and Stability AI
- Text-to-speech audio narration using advanced AI models
- Customizable video sections with editable titles and content
- Multi-provider AI model support
- Secure local storage for API keys
- Project configuration export/import functionality
- Comprehensive generation history tracking
- Modern UI with dark mode and responsive design

## Prerequisites

- Node.js (version 14 or later)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/LuminaFlowAI.git
   cd LuminaFlowAI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the project root with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   LEONARDO_API_KEY=your_leonardo_api_key
   STABILITY_API_KEY=your_stability_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Contributing

We welcome contributions! Please feel free to submit pull requests or open issues on our GitHub repository.

## License

MIT

## Support

For questions, bug reports, or feature requests, please open an issue on GitHub.z