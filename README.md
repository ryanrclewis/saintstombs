# SaintsTombs.com

A comprehensive web-based guide to the final resting places of saints and martyrs around the world. This project serves as a digital pilgrimage resource, documenting sacred sites and their historical significance.

## 🌍 Overview

SaintsTombs.com is a website that helps visitors discover and learn about the locations where saints and holy figures are buried across different regions of the world. The site provides detailed information about pilgrimage sites, organized by geographical regions.

## ✨ Features

- **Interactive Regional Explorer**: Browse saints' tombs by geographical regions including:
  - Europe (Italy, France, Spain, Germany, Austria, Belgium, Britain, Netherlands, Switzerland, Scandinavia, Eastern Europe)
  - Africa
  - Asia
  - North America
  - Oceania
  - Portugal

- **Responsive Design**: Fully responsive layout that works seamlessly on desktop, tablet, and mobile devices

- **Glassmorphism UI**: Modern glass-effect design elements with animated background globes

- **Markdown Content**: Region data stored in easily editable Markdown files for simple content management

- **SEO Optimized**: Meta tags, Open Graph, and Twitter Card integration for better social media sharing

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional, for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/saintstombs.git
cd saintstombs
```

2. Open the project:
   - Simply open `index.html` in your web browser, or
   - Use a local development server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server
   ```

3. Navigate to `http://localhost:8000` (or your server's port)

## 📁 Project Structure

```
saintstombs/
├── index.html          # Homepage
├── about.html          # About page
├── saints.html         # Saints explorer page
├── contact.html        # Contact page
├── donate.html         # Donation page
├── app.js              # Main application logic
├── global.js           # Global utilities and helpers
├── about.js            # About page functionality
├── saints.js           # Saints page functionality
├── style.css           # Main stylesheet
├── favicon.svg         # Site favicon
└── regions/            # Regional content in Markdown
    ├── africa.md
    ├── asia.md
    ├── austria.md
    ├── belgium.md
    ├── britain.md
    ├── eastern-europe.md
    ├── france.md
    ├── germany.md
    ├── italy.md
    ├── netherlands.md
    ├── north-america.md
    ├── oceania.md
    ├── portugal.md
    ├── scandinavia.md
    ├── spain.md
    └── switzerland.md
```

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Custom styles with glassmorphism effects
- **Vanilla JavaScript**: No framework dependencies
- **Marked.js**: Markdown parsing for content rendering
- **Google Fonts**: Texturina font family

## 📝 Adding Content

To add or update regional content:

1. Navigate to the `regions/` directory
2. Edit the relevant `.md` file for your region
3. Use Markdown formatting to structure content:
   ```markdown
   # Region Name
   
   ## Saint Name
   **Location**: City, Country
   **Description**: Information about the saint...
   ```
4. Save and refresh the website

## 🌐 Live Site

Visit [SaintsTombs.com](https://saintstombs.com) to see the live version.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions, suggestions, or to report issues, please visit the [Contact page](https://saintstombs.com/contact.html) or open an issue on GitHub.

## 💝 Support

If you find this project valuable, consider supporting its development through the [Donate page](https://saintstombs.com/donate.html).

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- All contributors who help maintain and expand the database of sacred sites
- The pilgrims and historians who preserve these sacred traditions
- The faith communities who maintain these holy sites

---

**Note**: This project is maintained as a resource for educational and spiritual purposes. Information should be verified with local sources before planning pilgrimages.
