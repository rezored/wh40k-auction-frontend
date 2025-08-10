# Backend Fix: Auction Owner Offer Visibility - URGENT

## Issue Description
Auction owners cannot see pending offers made on their auctions. The frontend "My Auctions & Offers" page is implemented but the backend is not correctly providing the offers data for auction owners to view and manage.

## Current Problem (Confirmed via Frontend Debugging)
- User makes an offer on an auction
- Offer shows as "pending" in the offerer's account
- Auction owner cannot see the pending offer in their "My Auctions & Offers" page
- Owner cannot approve/reject offers because they're not visible
- **CRITICAL**: The `/auctions/my-auctions` endpoint is NOT returning:
  - `saleType` field (shows as `undefined`)
  - `offers` array (shows as empty array)

## Frontend Debug Information
The frontend is calling: `GET https://api.brainfryer.com/api/v1/auctions/my-auctions`

**Expected Response Structure:**
```typescript
{
  auctions: [
    {
      id: string,
      title: string,
      saleType: 'auction' | 'direct',  // ← MISSING
      offers: [                        // ← MISSING
        {
          id: string,
          amount: number,
          status: 'pending' | 'accepted' | 'rejected',
          buyer: { id: string, username: string },
          createdAt: string
        }
      ],
      // ... other auction fields
    }
  ]
}
```

**Current Response (Problem):**
```typescript
{
  auctions: [
    {
      id: string,
      title: string,
      saleType: undefined,  // ← NOT INCLUDED
      offers: [],           // ← EMPTY ARRAY
      // ... other auction fields
    }
  ]
}
```

## Required Backend Changes

### 1. Fix `/auctions/my-auctions` Endpoint
**In your AuctionController:**
```typescript
@Get('my-auctions')
@UseGuards(JwtAuthGuard)
async getMyAuctions(@Request() req) {
  const userId = req.user.id;
  
  // Get user's auctions with ALL related data
  const auctions = await this.auctionService.getAuctionsByOwner(userId);
  
  // Get pending offers for each auction
  const auctionsWithOffers = await Promise.all(
    auctions.map(async (auction) => {
      // Get offers for this auction
      const offers = await this.offerService.getOffersForAuction(auction.id);
      
      return {
        ...auction,
        saleType: auction.saleType, // Ensure this field is included
        offers: offers.map(offer => ({
          id: offer.id,
          amount: offer.amount,
          status: offer.status,
          createdAt: offer.createdAt,
          buyer: {
            id: offer.buyer.id,
            username: offer.buyer.username
          }
        }))
      };
    })
  );
  
  return {
    auctions: auctionsWithOffers
  };
}
```

### 2. Update AuctionService Method
**In your AuctionService:**
```typescript
async getAuctionsByOwner(ownerId: string): Promise<Auction[]> {
  return this.auctionRepository.find({
    where: { owner: { id: ownerId } },
    relations: ['owner', 'bids', 'bids.bidder'], // Include all necessary relations
    order: { createdAt: 'DESC' }
  });
}
```

### 3. Update OfferService Method
**In your OfferService:**
```typescript
async getOffersForAuction(auctionId: string): Promise<Offer[]> {
  return this.offerRepository.find({
    where: { auction: { id: auctionId } },
    relations: ['buyer', 'auction'],
    order: { createdAt: 'DESC' }
  });
}
```

### 4. Ensure Database Schema Includes saleType
**Verify your Auction entity has:**
```typescript
@Entity()
export class Auction {
  // ... other fields
  
  @Column({
    type: 'enum',
    enum: ['auction', 'direct'],
    default: 'auction'
  })
  saleType: string;
  
  // ... other fields
}
```

### 5. Ensure Database Schema Includes Offers Relationship
**Verify your Auction entity has:**
```typescript
@Entity()
export class Auction {
  // ... other fields
  
  @OneToMany(() => Offer, offer => offer.auction)
  offers: Offer[];
  
  // ... other fields
}
```

### 6. Alternative: Create Dedicated Endpoint for Owner Offers
If the above doesn't work, create a separate endpoint:

```typescript
@Get('my-auction-offers')
@UseGuards(JwtAuthGuard)
async getMyAuctionOffers(@Request() req) {
  const userId = req.user.id;
  
  // Get all offers for auctions owned by this user
  const offers = await this.offerService.getOffersForAuctionOwner(userId);
  
  return {
    offers: offers.map(offer => ({
      id: offer.id,
      amount: offer.amount,
      status: offer.status,
      createdAt: offer.createdAt,
      auctionId: offer.auction.id,
      auctionTitle: offer.auction.title,
      auctionImage: offer.auction.imageUrl,
      buyer: {
        id: offer.buyer.id,
        username: offer.buyer.username
      }
    }))
  };
}
```

**And in OfferService:**
```typescript
async getOffersForAuctionOwner(ownerId: string): Promise<Offer[]> {
  return this.offerRepository.find({
    where: {
      auction: {
        owner: { id: ownerId }
      }
    },
    relations: ['auction', 'buyer', 'auction.owner'],
    order: { createdAt: 'DESC' }
  });
}
```

## Testing Steps
After implementing these changes:

1. **Test the endpoint directly:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://api.brainfryer.com/api/v1/auctions/my-auctions
   ```

2. **Verify response includes:**
   - `saleType` field for each auction
   - `offers` array with pending offers
   - All offer details (amount, status, buyer info)

3. **Test in frontend:**
   - Refresh the "My Auctions & Offers" page
   - Check that sale types display correctly
   - Check that pending offers appear in the "Pending Offers" tab

## Priority
This is a **CRITICAL** fix as it prevents auction owners from managing their auctions effectively. The core functionality of the auction system is broken without this fix.

## Expected Outcome
After implementing these changes:
- Auction owners can see all pending offers on their auctions
- Sale types display correctly (auction vs direct sale)
- Owners can accept or reject offers
- Both parties receive appropriate notifications
- The "My Auctions & Offers" page works correctly
