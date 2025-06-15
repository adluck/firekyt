# Complete Dependencies Guide

## Node.js/React Dependencies (package.json)

### Core Application Dependencies

#### Frontend Framework
```json
"react": "^18.3.1"
"react-dom": "^18.3.1"
"@types/react": "^18.3.11"
"@types/react-dom": "^18.3.1"
```

#### Routing and State Management
```json
"wouter": "^3.3.5"
"@tanstack/react-query": "^5.60.5"
```

#### UI Components (Radix UI)
```json
"@radix-ui/react-accordion": "^1.2.4"
"@radix-ui/react-alert-dialog": "^1.1.7"
"@radix-ui/react-aspect-ratio": "^1.1.3"
"@radix-ui/react-avatar": "^1.1.4"
"@radix-ui/react-checkbox": "^1.1.5"
"@radix-ui/react-collapsible": "^1.1.4"
"@radix-ui/react-context-menu": "^2.2.7"
"@radix-ui/react-dialog": "^1.1.7"
"@radix-ui/react-dropdown-menu": "^2.1.7"
"@radix-ui/react-hover-card": "^1.1.7"
"@radix-ui/react-label": "^2.1.3"
"@radix-ui/react-menubar": "^1.1.7"
"@radix-ui/react-navigation-menu": "^1.2.6"
"@radix-ui/react-popover": "^1.1.7"
"@radix-ui/react-progress": "^1.1.3"
"@radix-ui/react-radio-group": "^1.2.4"
"@radix-ui/react-scroll-area": "^1.2.4"
"@radix-ui/react-select": "^2.1.7"
"@radix-ui/react-separator": "^1.1.3"
"@radix-ui/react-slider": "^1.2.4"
"@radix-ui/react-slot": "^1.2.0"
"@radix-ui/react-switch": "^1.1.4"
"@radix-ui/react-tabs": "^1.1.4"
"@radix-ui/react-toast": "^1.2.7"
"@radix-ui/react-toggle": "^1.1.3"
"@radix-ui/react-toggle-group": "^1.1.3"
"@radix-ui/react-tooltip": "^1.2.0"
```

#### Styling and Animation
```json
"tailwindcss": "^3.4.17"
"tailwindcss-animate": "^1.0.7"
"tailwind-merge": "^2.6.0"
"@tailwindcss/typography": "^0.5.15"
"@tailwindcss/vite": "^4.1.3"
"class-variance-authority": "^0.7.1"
"clsx": "^2.1.1"
"framer-motion": "^11.13.1"
"tw-animate-css": "^1.2.5"
"vaul": "^1.1.2"
"next-themes": "^0.4.6"
```

#### Backend Framework
```json
"express": "^4.21.2"
"@types/express": "4.17.21"
"helmet": "^8.1.0"
"express-session": "^1.18.1"
"@types/express-session": "^1.18.0"
"ws": "^8.18.0"
"@types/ws": "^8.5.13"
```

#### Database and ORM
```json
"drizzle-orm": "^0.39.1"
"drizzle-zod": "^0.7.0"
"drizzle-kit": "^0.30.4"
"postgres": "^3.4.7"
"@neondatabase/serverless": "^0.10.4"
"connect-pg-simple": "^10.0.0"
"@types/connect-pg-simple": "^7.0.3"
```

#### Authentication and Security
```json
"passport": "^0.7.0"
"passport-local": "^1.0.0"
"@types/passport": "^1.0.16"
"@types/passport-local": "^1.0.38"
"bcryptjs": "^3.0.2"
"jsonwebtoken": "^9.0.2"
"@types/jsonwebtoken": "^9.0.9"
"openid-client": "^6.5.1"
```

#### Payment Processing (Stripe)
```json
"@stripe/react-stripe-js": "^3.7.0"
"@stripe/stripe-js": "^7.3.1"
"stripe": "^18.2.1"
```

#### Performance and Caching
```json
"node-cache": "^5.1.2"
"memoizee": "^0.4.17"
"@types/memoizee": "^0.4.12"
"memorystore": "^1.6.7"
"express-rate-limit": "^7.5.0"
```

#### AI Integration
```json
"@google/generative-ai": "^0.24.1"
```

#### Forms and Validation
```json
"react-hook-form": "^7.55.0"
"@hookform/resolvers": "^3.10.0"
"zod": "^3.24.2"
"zod-validation-error": "^3.5.0"
```

#### Rich Text Editor
```json
"@tiptap/react": "^2.14.0"
"@tiptap/starter-kit": "^2.14.0"
"@tiptap/extension-image": "^2.14.0"
"@tiptap/extension-link": "^2.14.0"
"@tiptap/extension-table": "^2.14.0"
"@tiptap/extension-table-cell": "^2.14.0"
"@tiptap/extension-table-header": "^2.14.0"
"@tiptap/extension-table-row": "^2.14.0"
```

#### Utilities and Helpers
```json
"date-fns": "^3.6.0"
"nanoid": "^5.1.5"
"cmdk": "^1.1.1"
"lucide-react": "^0.453.0"
"react-icons": "^5.4.0"
"react-day-picker": "^8.10.1"
"input-otp": "^1.4.2"
"embla-carousel-react": "^8.6.0"
"react-resizable-panels": "^2.1.7"
"@hello-pangea/dnd": "^18.0.1"
"recharts": "^2.15.2"
```

### Development Dependencies

#### Build Tools
```json
"vite": "^5.4.14"
"@vitejs/plugin-react": "^4.3.2"
"esbuild": "^0.25.0"
"tsx": "^4.19.1"
"typescript": "5.6.3"
"@types/node": "20.16.11"
```

#### Testing Framework
```json
"vitest": "^2.1.8"
"@vitest/coverage-v8": "^2.1.8"
"supertest": "^7.0.0"
"@types/supertest": "^6.0.2"
```

#### Load Testing Tools
```json
"artillery": "^2.0.20"
"autocannon": "^7.15.0"
```

#### Development Tools
```json
"autoprefixer": "^10.4.20"
"postcss": "^8.4.47"
"nodemon": "^3.1.7"
"cross-env": "^7.0.3"
```

#### Replit Integration
```json
"@replit/vite-plugin-cartographer": "^0.2.7"
"@replit/vite-plugin-runtime-error-modal": "^0.0.3"
```

## Python Dependencies (python-requirements.txt)

### Core Framework
```txt
aiohttp>=3.12.12          # Async HTTP client/server
requests>=2.32.4          # HTTP library
fastapi>=0.104.1          # Modern API framework
uvicorn>=0.24.0           # ASGI server
```

### AI and Machine Learning
```txt
openai>=1.86.0            # OpenAI API client
anthropic>=0.54.0         # Anthropic AI API
google-generativeai>=0.8.0  # Google Gemini API
```

### Web Scraping and Data Extraction
```txt
beautifulsoup4>=4.13.4    # HTML/XML parsing
lxml>=5.4.0               # XML/HTML parser
selenium>=4.33.0          # Web browser automation
trafilatura>=2.0.0        # Web content extraction
```

### API Integration
```txt
python-amazon-paapi>=5.0.1  # Amazon Product API
serpapi>=0.1.5            # Search engine results API
```

### Database
```txt
psycopg2-binary>=2.9.9    # PostgreSQL adapter
sqlalchemy>=2.0.23        # SQL toolkit and ORM
```

### Data Processing
```txt
pandas>=2.1.4             # Data analysis library
numpy>=1.24.4             # Numerical computing
```

### Performance and Caching
```txt
redis>=5.0.1              # In-memory data store
celery>=5.3.4             # Distributed task queue
```

### Testing
```txt
pytest>=7.4.3            # Testing framework
pytest-asyncio>=0.21.1   # Async testing support
pytest-cov>=4.1.0        # Coverage plugin
pytest-mock>=3.12.0      # Mock plugin
locust>=2.17.0            # Load testing framework
```

### Monitoring and Logging
```txt
prometheus-client>=0.19.0  # Metrics collection
sentry-sdk>=1.38.0        # Error tracking
```

### Development and Code Quality
```txt
black>=23.11.0            # Code formatter
flake8>=6.1.0             # Linting
mypy>=1.7.1               # Static type checking
isort>=5.12.0             # Import sorting
```

### Utilities
```txt
python-dotenv>=1.0.0      # Environment variables
click>=8.1.7              # Command line interface
pydantic>=2.5.0           # Data validation
cryptography>=41.0.7      # Cryptographic recipes
pyjwt>=2.8.0              # JWT implementation
python-dateutil>=2.8.2    # Date utilities
orjson>=3.9.10            # Fast JSON library
httpx>=0.25.2             # HTTP client
```

### Performance Profiling
```txt
py-spy>=0.3.14            # Sampling profiler
memory-profiler>=0.61.0   # Memory usage monitoring
```

## Installation Instructions

### Node.js Dependencies
```bash
# Install all dependencies
npm install

# Install specific dev dependencies for testing
npm install --save-dev vitest @vitest/coverage-v8 supertest @types/supertest
npm install --save-dev artillery autocannon nodemon cross-env

# Install performance monitoring dependencies
npm install --save node-cache memoizee express-rate-limit
```

### Python Dependencies
```bash
# Using pip
pip install -r python-requirements.txt

# Using conda
conda install --file python-requirements.txt

# Install specific categories
pip install aiohttp requests fastapi uvicorn  # Core framework
pip install openai anthropic google-generativeai  # AI services
pip install beautifulsoup4 lxml selenium trafilatura  # Web scraping
pip install pytest pytest-asyncio pytest-cov locust  # Testing
```

## System Requirements

### Node.js Environment
- Node.js >= 18.0.0
- npm >= 9.0.0
- TypeScript >= 5.6.3

### Python Environment
- Python >= 3.11
- pip >= 23.0

### Database
- PostgreSQL >= 14.0

### Optional Dependencies
- Redis >= 6.0 (for enhanced caching)
- Docker (for containerized deployment)

## Performance Optimization Dependencies

### Caching Layer
```json
"node-cache": "^5.1.2"        # In-memory caching
"memoizee": "^0.4.17"         # Function memoization
"memorystore": "^1.6.7"       # Session storage
```

### Rate Limiting
```json
"express-rate-limit": "^7.5.0"  # API rate limiting
```

### Monitoring and Analytics
```json
"@jridgewell/trace-mapping": "^0.3.25"  # Source map support
```

### Testing and Benchmarking
```json
"vitest": "^2.1.8"           # Unit testing framework
"@vitest/coverage-v8": "^2.1.8"  # Code coverage
"supertest": "^7.0.0"        # HTTP assertion library
"artillery": "^2.0.20"       # Load testing
"autocannon": "^7.15.0"      # HTTP benchmarking
```

## Development Workflow

### Setup Commands
```bash
# Clone and install
git clone <repository>
cd affiliate-marketing-platform
npm install

# Database setup
npm run db:push

# Start development server
npm run dev

# Run tests
npm run test
npm run test:performance
npm run benchmark

# Load testing
npm run load-test
```

### Python Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r python-requirements.txt

# Run tests
pytest
pytest --cov=. --cov-report=html
```

This comprehensive dependency guide ensures all necessary packages are properly documented with versions, categories, and installation instructions for the complete affiliate marketing platform with performance optimization features.