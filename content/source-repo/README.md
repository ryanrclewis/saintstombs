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
├── index.html               # Homepage
├── about.html               # About page
├── saints.html              # Saints explorer page
├── search.html              # Search page (D1-powered)
├── contact.html             # Contact page
├── donate.html              # Donation page
├── app.js                   # Main application logic
├── global.js                # Global utilities and helpers
├── about.js                 # About page functionality
├── saints.js                # Saints page functionality
├── search.js                # Search page functionality
├── style.css                # Main stylesheet
├── favicon.svg              # Site favicon
├── wrangler.toml            # Cloudflare Workers + D1 config
├── admin/                   # Decap CMS admin UI
│   ├── index.html
│   └── config.yml
├── workers/
│   └── search/
│       ├── index.js         # Cloudflare Worker (search API)
│       ├── schema.sql       # D1 database schema
│       └── populate.js      # Seed D1 from markdown files
└── regions/                 # Regional content in Markdown
    ├── africa.md
    ├── asia.md
    ├── austria.md
    ├── belgium.md
    ├── britain.md
    ├── eastern-europe.md
    ├── france.md
    ├── germany.md
    ├── ireland.md
    ├── italy.md
    ├── latin-america.md
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
- **Decap CMS**: Git-based CMS for in-browser content editing
- **Cloudflare Workers**: Serverless edge search API
- **Cloudflare D1**: SQLite-at-the-edge database with FTS5 full-text search

## 🔍 Hybrid CMS + Search Setup

The site uses **Decap CMS** for editing content and **Cloudflare Workers + D1** for fast full-text search. Follow the steps below to activate both features.

---

### Part 1 — Decap CMS (content editing)

Decap CMS lets anyone with GitHub access edit the markdown region files through a Word-style browser editor at `https://saintstombs.com/admin/`.

#### Step 1 – Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name**: `SaintsTombs CMS`
   - **Homepage URL**: `https://saintstombs.com`
   - **Authorization callback URL**: `https://saintstombs.com/api/auth/callback`  
     *(Cloudflare Pages will handle this callback automatically once configured)*
3. Click **Register application**.
4. Copy the **Client ID** and generate a **Client secret** — you will need both in the next step.

#### Step 2 – Add OAuth secrets in Cloudflare Pages

1. Open **Cloudflare Dashboard → Pages → saintstombs → Settings → Environment variables**.
2. Add the following **production** environment variables (mark them as secrets):

   | Variable | Value |
   |---|---|
   | `GITHUB_CLIENT_ID` | Client ID from Step 1 |
   | `GITHUB_CLIENT_SECRET` | Client secret from Step 1 |

3. Save and **redeploy** the project so the variables take effect.

#### Step 3 – Enable Git Gateway (Cloudflare Pages)

Cloudflare Pages has built-in OAuth proxy support for Decap CMS. No extra configuration is needed beyond the environment variables above.

#### Step 4 – Access the CMS

Navigate to `https://saintstombs.com/admin/` and click **Login with GitHub**. You will be asked to authorize the OAuth app. Once logged in you can:

- Browse all region files listed under **Regions**.
- Click any region to open the rich-text editor.
- Make changes and click **Publish** — this creates a commit directly to the `main` branch.

> **Tip:** To restrict who can log in, create a Cloudflare Access policy for the `/admin/*` path.

---

### Part 2 — Cloudflare Workers + D1 Search

The search page (`/search.html`) queries a Cloudflare Worker that performs full-text search against a D1 SQLite database.

#### Prerequisites

Install the Wrangler CLI and log in:

```bash
npm install -g wrangler
wrangler login
```

#### Step 1 – Create the D1 database

```bash
wrangler d1 create saints-search
```

Copy the **database ID** printed in the output (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

#### Step 2 – Update wrangler.toml

Open `wrangler.toml` at the repo root and replace `<YOUR_D1_DATABASE_ID>` with the ID you just copied:

```toml
[[d1_databases]]
binding = "DB"
database_name = "saints-search"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   # ← paste here
```

#### Step 3 – Apply the database schema

```bash
wrangler d1 execute saints-search --remote --file=workers/search/schema.sql
```

#### Step 4 – Seed the database from the markdown files

```bash
node workers/search/populate.js > /tmp/seed.sql
wrangler d1 execute saints-search --remote --file=/tmp/seed.sql
```

This parses every `regions/*.md` file and inserts all saint entries into D1. Re-run this command whenever you add or update region files.

#### Step 5 – Deploy the Worker

```bash
wrangler deploy
```

After deployment, Wrangler prints your Worker URL, which looks like:

```
https://saintstombs-search.<YOUR_SUBDOMAIN>.workers.dev
```

#### Step 6 – Update search.js with the Worker URL

Open `search.js` and replace the placeholder at the top of the file:

```js
// Before
const WORKER_URL = 'https://saintstombs-search.<YOUR_SUBDOMAIN>.workers.dev';

// After (example)
const WORKER_URL = 'https://saintstombs-search.myaccount.workers.dev';
```

Commit and push the change — Cloudflare Pages will automatically redeploy.

#### Step 7 – Allow your domain in the Worker CORS header

Open `workers/search/index.js` and update the `Access-Control-Allow-Origin` header if your production domain differs from `https://saintstombs.com`:

```js
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://saintstombs.com', // ← your domain
  ...
};
```

Then redeploy the Worker:

```bash
wrangler deploy
```

#### Re-seeding after content edits

Every time you edit a region markdown file via Decap CMS (or directly in Git), re-run the seed command to keep the D1 database in sync:

```bash
node workers/search/populate.js > /tmp/seed.sql
wrangler d1 execute saints-search --remote --file=/tmp/seed.sql
```

> **Automation tip:** You can add a GitHub Actions workflow that runs these commands automatically on every push to `main`.

---

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
