# Trading Bot Dashboard

A comprehensive, mobile-responsive dashboard for managing trading bots and fuel balance.

## Features

### 🎛️ Dashboard Overview

- **Mobile-first design** with responsive grid layout
- **Real-time data updates** using React Query
- **Animated components** with Framer Motion
- **Quick stats** showing bots, balance, and P&L

### ⚡ Fuel Panel

- **Real-time fuel balance** display
- **Buy fuel** button with modal integration
- **Transaction history** with recent activity
- **Usage statistics** and analytics

### 🤖 Strategy Widgets

#### Alpha Compounder

- **Performance metrics** (P&L, Win Rate, Trades, Balance)
- **Bot status** with colored indicators
- **Active positions** summary
- **Control buttons** (Start/Pause/Resume)
- **Setup flow** for new users

#### XPat Trader

- **Same functionality** as Alpha Compounder
- **Unique branding** (emerald/teal theme)
- **Pattern recognition** messaging

### 🔗 Exchange Connection

- **Multi-step wizard** interface
- **5 major exchanges** supported (Binance, Bybit, OKX, Bitget, Hyperliquid)
- **API credentials** form with validation
- **Connection testing** simulation
- **Bot initialization** flow

## Usage

### Accessing the Dashboard

Navigate to `/trading-bots/dashboard` or click "Trading Bots" in the main navigation.

### Setting Up a Bot

1. Click "Connect Exchange" on either strategy widget
2. Select your preferred exchange
3. Enter API credentials
4. Test connection
5. Configure starting balance
6. Initialize bot

### Managing Fuel

1. View current balance in the fuel panel
2. Click "Buy Fuel" to purchase fuel packages
3. Review transaction history
4. Monitor usage statistics

## Mobile Responsiveness

### Breakpoints

- **Mobile**: 320px+ (stacked layout)
- **Tablet**: 768px+ (2-column strategy grid)
- **Desktop**: 1024px+ (full 3-column layout)

### Mobile Features

- Touch-friendly buttons
- Collapsible sections
- Optimized typography
- Responsive images and icons

## Technical Details

### Components

- `page.tsx` - Main dashboard page
- `FuelPanel.tsx` - Fuel management component
- `AlphaCompounderWidget.tsx` - Alpha Compounder strategy
- `XPatWidget.tsx` - XPat Trader strategy
- `ExchangeConnectionModal.tsx` - Exchange setup modal
- `FuelPackagesModal.tsx` - Fuel purchase modal

### Data Fetching

- React Query for caching and state management
- Real-time updates with query invalidation
- Error handling and loading states
- Optimistic updates for better UX

### Styling

- TailwindCSS for responsive design
- Framer Motion for animations
- Dark mode support
- Consistent design system

## Navigation Update

The main navigation "Trading Bots" link now points to this dashboard (`/trading-bots/dashboard`) instead of the previous listing page, providing users with immediate access to the most important trading bot management features.
