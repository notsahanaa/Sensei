# Sensei Landing Page

A responsive React landing page for Sensei - a productivity tool for side hustles.

## Features

- Responsive design that works on all devices
- EB Garamond font for elegant typography
- Waitlist email collection form with active/inactive button states
- Social media link to X/Twitter
- Clean, modern dark theme design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

To create a production build:

```bash
npm run build
```

The build files will be in the `dist` folder.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
sensei-lp-v2/
├── src/
│   ├── App.jsx          # Main landing page component
│   ├── App.css          # Styling for the landing page
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

## Design Specifications

- **Font**: EB Garamond
- **Colors**:
  - Background: #000000
  - Primary Text: #FFFFFF
  - Subtitle Line 1: #879FC8
  - Subtitle Line 2: #4B5D7C
  - Pill Background: #181818
  - Divider: #252525
  - Input Background: #181818
  - Placeholder: #AEAEAE
  - Button Inactive: #2B3547
  - Button Active: #879FC8

## Technologies Used

- React 18
- Vite
- CSS3 with responsive design
- EB Garamond font (Google Fonts)
