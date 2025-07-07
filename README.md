# Inventory Management System for Frames Distributor

## Overview

This system is designed for a frames distributor supplying to over 50 shops in a city. It handles inventory tracking, sales recording, and provides dashboards for both shops and the distributor.

## Business Context

- Distributor supplies frames to shops
- Shops receive initial stock (e.g., 500 frames) but are billed only for items sold monthly
- Each frame has a unique product ID and supports various lens types (Regular, Premium, Pro)

## System Flow

1. Distributor adds a new shop and uploads a CSV with initial inventory
2. Shop employees search for frames using product ID/name
3. On sale:
   - Select frame
   - Choose lens type (Regular/Premium/Pro)
   - System auto-calculates total price
   - Marks item as sold
4. At month-end:
   - Distributor views shop-wise sales
   - Bills only for sold inventory
   - Unsold stock remains unpaid

## Features

### Shop Portal
- Product Search: Search by product ID or name
- Inventory Display: View available frames with details
- Sales Recording: Mark items as sold, choose lens type, and compute price
- Sales History: View past sales and billing status

### Distributor Portal
- Shop Management: Add/remove shops
- Inventory Management: Stock shops with inventory via CSV upload
- Sales Monitoring: View sales data across all shops
- Monthly Billing: Generate bills for sold items only

### Dashboards
- Sales trends
- Revenue summaries
- Shop performance comparison
- Low stock alerts

## Technical Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: SQLite

## Project Structure

```
inventory-management-system/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       └── pages/          # Page components
├── server/                 # Express.js backend
│   └── index.js            # Server entry point
├── database/               # SQLite database
└── README.md               # This file
```

## Dependencies

### Frontend
- React
- React Router
- Axios
- Chart.js

### Backend
- Express.js
- SQLite3
- Multer (for file uploads)
- CORS

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository or extract the project files

2. Install server dependencies:
   ```
   cd inventory-management-system/server
   npm install
   ```

3. Install client dependencies:
   ```
   cd ../client
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd inventory-management-system/server
   node index.js
   ```
   The server will run on http://localhost:5000

2. Start the frontend application:
   ```
   cd inventory-management-system/client
   npm start
   ```
   The application will open in your browser at http://localhost:3000

## Usage Guide

1. Login as either Distributor or Shop
2. For first-time setup, login as Distributor to add shops
3. Upload inventory CSV for each shop (columns: product_id, name, description, price, quantity)
4. Shop users can then login, search for frames, and record sales
5. At month-end, the Distributor can generate and process bills

## Database Schema

- **shops**: Stores information about each shop
- **frames**: Contains details about frame products
- **shop_inventory**: Links shops with their available frames
- **lens_types**: Defines different lens options and price multipliers
- **sales**: Records all sales transactions

## Notes

- The system uses local storage for simple authentication
- For production use, implement proper authentication and authorization
- The database is set up to initialize required tables on first run
- Sample data can be provided via CSV upload

# inventoy-management-project
