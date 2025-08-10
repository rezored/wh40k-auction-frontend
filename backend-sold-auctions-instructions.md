# Backend Implementation Instructions: Sold Auctions Visibility

## Overview
This document provides comprehensive instructions for implementing the backend logic to hide sold auctions from the main auctions listing while keeping them visible in the user's personal auctions tab.

## Frontend Changes Made

### 1. Updated AuctionFilters Interface
```typescript
export interface AuctionFilters {
  // ... existing properties
  excludeSold?: boolean; // Exclude sold auctions from main listings
}
```

### 2. Updated Auctions Component
- Added `excludeSold: !this.showOwn` to filter parameters
- When `showOwn` is false (main auctions tab), `excludeSold` is true
- When `showOwn` is true (personal auctions), `excludeSold` is false

### 3. Updated My Auctions Component
- Added proper status handling for 'sold' auctions
- Sold auctions will display with 'badge-info' class and 'Sold' text

## Backend Implementation Requirements

### 1. Update Auction Filtering Logic

#### API Endpoint: `GET /api/auctions`
**Current Behavior**: Returns all auctions based on filters
**Required Change**: Add `excludeSold` parameter handling

```javascript
// Example implementation (Node.js/Express)
app.get('/api/auctions', async (req, res) => {
  try {
    const {
      categoryGroup,
      category,
      scale,
      era,
      condition,
      status,
      priceRange,
      showOwn,
      sortBy,
      page = 1,
      limit = 12,
      excludeSold = false // NEW PARAMETER
    } = req.query;

    // Build query conditions
    let queryConditions = {};

    // Handle showOwn filter
    if (showOwn === 'true') {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      queryConditions.ownerId = req.user.id;
    }

    // Handle excludeSold filter - CRITICAL NEW LOGIC
    if (excludeSold === 'true') {
      queryConditions.status = { $ne: 'sold' }; // Exclude sold auctions
    }

    // Apply other filters
    if (categoryGroup) queryConditions.categoryGroup = categoryGroup;
    if (category) queryConditions.category = category;
    if (scale) queryConditions.scale = scale;
    if (era) queryConditions.era = era;
    if (condition) queryConditions.condition = condition;
    if (status) queryConditions.status = status;

    // Execute query
    const auctions = await Auction.find(queryConditions)
      .sort(getSortCriteria(sortBy))
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('owner', 'username');

    const total = await Auction.countDocuments(queryConditions);

    res.json({
      auctions,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});
```

### 2. Database Schema Requirements

Ensure your auction model includes a `status` field:

```javascript
// Auction Schema (MongoDB/Mongoose example)
const auctionSchema = new mongoose.Schema({
  // ... existing fields
  status: {
    type: String,
    enum: ['active', 'ended', 'cancelled', 'sold'],
    default: 'active'
  },
  // ... other fields
});
```

### 3. Auction Status Management

#### When to Mark Auctions as 'sold':

1. **Auction End with Winning Bid**:
```javascript
// When auction ends and has winning bid
if (auction.endTime <= new Date() && auction.bids.length > 0) {
  const winningBid = auction.bids.sort((a, b) => b.amount - a.amount)[0];
  auction.status = 'sold';
  auction.winnerId = winningBid.bidderId;
  auction.soldPrice = winningBid.amount;
  await auction.save();
}
```

2. **Direct Sale Completion**:
```javascript
// When direct sale offer is accepted
app.post('/api/offers/:offerId/accept', async (req, res) => {
  const offer = await Offer.findById(req.params.offerId);
  const auction = await Auction.findById(offer.auctionId);
  
  auction.status = 'sold';
  auction.winnerId = offer.buyerId;
  auction.soldPrice = offer.amount;
  await auction.save();
  
  // Update offer status
  offer.status = 'accepted';
  await offer.save();
  
  res.json({ success: true });
});
```

### 4. API Response Examples

#### Main Auctions Tab (excludeSold: true)
```json
{
  "auctions": [
    {
      "id": "1",
      "title": "Space Marine Captain",
      "status": "active",
      "currentPrice": 50.00
    },
    {
      "id": "2", 
      "title": "Ork Warboss",
      "status": "ended",
      "currentPrice": 75.00
    }
    // Note: No 'sold' auctions in response
  ],
  "total": 2,
  "page": 1,
  "limit": 12,
  "totalPages": 1
}
```

#### Personal Auctions Tab (excludeSold: false)
```json
{
  "auctions": [
    {
      "id": "1",
      "title": "Space Marine Captain",
      "status": "active",
      "currentPrice": 50.00
    },
    {
      "id": "3",
      "title": "Eldar Farseer", 
      "status": "sold",
      "soldPrice": 120.00
    }
    // Note: Sold auctions are included
  ],
  "total": 2,
  "page": 1,
  "limit": 12,
  "totalPages": 1
}
```

### 5. Testing Scenarios

#### Test Case 1: Main Auctions Tab
1. Create auctions with different statuses: active, ended, cancelled, sold
2. Call `GET /api/auctions?excludeSold=true`
3. Verify only non-sold auctions are returned

#### Test Case 2: Personal Auctions Tab
1. Create auctions owned by a user with different statuses
2. Call `GET /api/auctions?showOwn=true&excludeSold=false`
3. Verify all auctions (including sold) are returned

#### Test Case 3: Status Transitions
1. Create an active auction
2. Simulate auction end with winning bid
3. Verify status changes to 'sold'
4. Verify it disappears from main tab but appears in personal tab

### 6. Performance Considerations

1. **Database Indexing**:
```javascript
// Add index for efficient filtering
db.auctions.createIndex({ "status": 1, "ownerId": 1 });
db.auctions.createIndex({ "status": 1, "category": 1 });
```

2. **Query Optimization**:
- Use database indexes for status and ownerId fields
- Consider pagination for large datasets
- Cache frequently accessed auction lists

### 7. Error Handling

```javascript
// Handle invalid status values
if (status && !['active', 'ended', 'cancelled', 'sold'].includes(status)) {
  return res.status(400).json({ error: 'Invalid status value' });
}

// Handle authentication for showOwn
if (showOwn === 'true' && !req.user) {
  return res.status(401).json({ error: 'Authentication required for personal auctions' });
}
```

### 8. Migration Strategy

If you have existing auctions without status:

```javascript
// Migration script
db.auctions.updateMany(
  { status: { $exists: false } },
  { $set: { status: "active" } }
);

// Update ended auctions without bids
db.auctions.updateMany(
  { 
    endTime: { $lt: new Date() },
    "bids.0": { $exists: false },
    status: "active"
  },
  { $set: { status: "ended" } }
);
```

## Summary

The key changes required:

1. **Add `excludeSold` parameter** to auction filtering API
2. **Implement status-based filtering** in database queries
3. **Update auction status management** to mark auctions as 'sold'
4. **Ensure proper authentication** for personal auction views
5. **Add database indexes** for performance
6. **Test all scenarios** thoroughly

This implementation ensures sold auctions are hidden from the main browsing experience while remaining accessible to their owners in the personal tab.
