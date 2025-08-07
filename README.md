# WH40K Auction House

A modern auction house application for Warhammer 40,000 collectibles and miniatures, built with Angular 17 and Bootstrap.

## Features

- **Modern UI/UX**: Clean, responsive design with Bootstrap 5
- **Auction Management**: Create, view, and manage auctions
- **Bidding System**: Real-time bidding with bid history
- **User Authentication**: Secure login and registration
- **Search & Filter**: Advanced filtering by category, price, and status
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Angular 17 (Standalone Components)
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Font Awesome 6
- **HTTP Client**: Angular HttpClient with interceptors
- **State Management**: Angular Signals

## Environment Configuration

The application uses environment files to manage different configurations:

### Development Environment (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  appName: 'WH40K Auction House',
  version: '1.0.0'
};
```

### Production Environment (`src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.wh40k-auction.com/api/v1', // Update with your production API
  appName: 'WH40K Auction House',
  version: '1.0.0'
};
```

### Configuration Service

The application uses a centralized `ConfigService` to manage all API endpoints and configuration:

```typescript
// Available endpoints
configService.authEndpoints.login
configService.authEndpoints.register
configService.auctionEndpoints.list
configService.auctionEndpoints.detail(id)
configService.bidEndpoints.myBids
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wh40k-auction-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
   - Update `src/environments/environment.ts` for development
   - Update `src/environments/environment.prod.ts` for production

4. Start the development server:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:4200`

## Project Structure

```
src/
├── app/
│   ├── auth/                 # Authentication components
│   │   ├── login/
│   │   └── register/
│   ├── auctions/             # Auction-related components
│   │   ├── auction-detail/
│   │   └── create-auction/
│   ├── bids/                 # Bidding components
│   │   └── my-bids/
│   ├── profile/              # User profile
│   ├── services/             # API services
│   │   ├── auth.service.ts
│   │   ├── auction.service.ts
│   │   └── config.service.ts
│   ├── app.component.ts      # Main app component
│   ├── app.config.ts         # App configuration
│   └── app.routes.ts         # Routing configuration
├── environments/              # Environment configuration
│   ├── environment.ts        # Development environment
│   └── environment.prod.ts   # Production environment
├── styles.scss               # Global styles
└── main.ts                   # Application entry point
```

## Features Overview

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes

### Auction Management
- Create new auctions with detailed information
- Upload images and set starting prices
- Set auction end times
- Category and condition selection

### Bidding System
- Real-time bidding on active auctions
- Bid history tracking
- Current price display
- Time remaining countdown

### Search & Filter
- Filter by category (Miniatures, Books, Terrain, etc.)
- Filter by price range
- Filter by auction status
- Sort by various criteria

### User Dashboard
- View personal bidding history
- Track auction status
- Manage profile information

## API Integration

The application is designed to work with a backend API. Update the API endpoints in the environment files:

- `src/environments/environment.ts` - Development API endpoints
- `src/environments/environment.prod.ts` - Production API endpoints

### API Endpoints Structure

```typescript
// Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login

// Auctions
GET /api/v1/auctions
GET /api/v1/auctions/:id
POST /api/v1/auctions
GET /api/v1/auctions/my-auctions

// Bidding
POST /api/v1/auctions/:id/bids
GET /api/v1/bids/my-bids
```

## Styling

The application uses a custom WH40K theme with:
- Dark gradient backgrounds
- Gold accent colors
- Modern card-based layouts
- Responsive grid system
- Custom animations and transitions

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Code Style
The project uses Prettier for code formatting. Run:
```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Warhammer 40,000 is a trademark of Games Workshop
- Built with Angular and Bootstrap
- Icons provided by Font Awesome
