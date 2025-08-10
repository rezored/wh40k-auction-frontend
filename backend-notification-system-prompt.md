# Backend Notification System Implementation Prompt

## **Project Context**
You are working on the WH40K Auction Backend project at [https://github.com/rezored/wh40k-auction-backend](https://github.com/rezored/wh40k-auction-backend). The frontend team has implemented a comprehensive notification system and needs the backend to support it.

## **Objective**
Implement a complete notification system that handles real-time notifications for bids, offers, and offer responses. The system should notify both users involved in any transaction.

## **Current Frontend Implementation**
The frontend has already implemented:
- Notification service with API endpoints at `/api/v1/notifications`
- Notification bell UI with dropdown
- Real-time notification polling
- Support for all notification types

## **Required Backend Implementation**

### **1. Database Schema**

Create a new `notifications` table:

```sql
-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bid_placed', 'bid_outbid', 'offer_received', 'offer_accepted', 'offer_rejected', 'offer_expired', 'auction_ended', 'auction_won')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### **2. TypeScript Interfaces**

```typescript
// notification.interface.ts
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 
  | 'bid_placed'
  | 'bid_outbid'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_expired'
  | 'auction_ended'
  | 'auction_won';

export interface NotificationData {
  auctionId?: string;
  auctionTitle?: string;
  bidAmount?: number;
  offerAmount?: number;
  bidderName?: string;
  offererName?: string;
  winnerAddress?: any;
  finalPrice?: number;
  shippingInfo?: any;
}

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAsReadResponse {
  success: boolean;
}

export interface MarkAllAsReadResponse {
  success: boolean;
}

export interface DeleteNotificationResponse {
  success: boolean;
}

export interface CreateNotificationResponse {
  notification: Notification;
}
```

### **3. API Endpoints**

Implement these REST endpoints:

```typescript
// GET /api/v1/notifications
// Get all notifications for the current user with pagination
// Query params: page, limit, unreadOnly

// GET /api/v1/notifications/unread-count
// Get unread notification count

// PUT /api/v1/notifications/:id/read
// Mark a notification as read

// PUT /api/v1/notifications/mark-all-read
// Mark all notifications as read

// DELETE /api/v1/notifications/:id
// Delete a notification

// POST /api/v1/notifications
// Create a notification (internal use)
```

### **4. Notification Service**

Create a comprehensive notification service:

```typescript
// notification.service.ts
@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>
  ) {}

  async createNotification(userId: string, data: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      ...data,
      data: data.data || {}
    });
    return await this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: string, query: GetNotificationsQuery = {}): Promise<NotificationResponse> {
    const { page = 1, limit = 50, unreadOnly = false } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip,
      take: limit
    });

    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications,
      unreadCount
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false }
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, userId });
  }

  // Helper methods for specific notification types
  async notifyBidPlaced(auctionOwnerId: string, auctionTitle: string, bidAmount: number, bidderName: string, auctionId: string): Promise<void> {
    await this.createNotification(auctionOwnerId, {
      type: 'bid_placed',
      title: 'New Bid Received',
      message: `${bidderName} placed a bid of €${bidAmount} on "${auctionTitle}"`,
      data: {
        auctionId,
        auctionTitle,
        bidAmount,
        bidderName
      }
    });
  }

  async notifyBidOutbid(userId: string, auctionTitle: string, bidAmount: number, auctionId: string): Promise<void> {
    await this.createNotification(userId, {
      type: 'bid_outbid',
      title: 'You Have Been Outbid',
      message: `Someone outbid you on "${auctionTitle}"`,
      data: {
        auctionId,
        auctionTitle,
        bidAmount
      }
    });
  }

  async notifyOfferReceived(auctionOwnerId: string, auctionTitle: string, offerAmount: number, offererName: string, auctionId: string): Promise<void> {
    await this.createNotification(auctionOwnerId, {
      type: 'offer_received',
      title: 'New Offer Received',
      message: `${offererName} made an offer of €${offerAmount} on "${auctionTitle}"`,
      data: {
        auctionId,
        auctionTitle,
        offerAmount,
        offererName
      }
    });
  }

  async notifyOfferAccepted(offererId: string, auctionTitle: string, offerAmount: number, auctionId: string): Promise<void> {
    await this.createNotification(offererId, {
      type: 'offer_accepted',
      title: 'Offer Accepted!',
      message: `Your offer of €${offerAmount} on "${auctionTitle}" was accepted!`,
      data: {
        auctionId,
        auctionTitle,
        offerAmount
      }
    });
  }

  async notifyOfferRejected(offererId: string, auctionTitle: string, offerAmount: number, auctionId: string): Promise<void> {
    await this.createNotification(offererId, {
      type: 'offer_rejected',
      title: 'Offer Rejected',
      message: `Your offer of €${offerAmount} on "${auctionTitle}" was not accepted.`,
      data: {
        auctionId,
        auctionTitle,
        offerAmount
      }
    });
  }

  async notifyAuctionWon(winnerId: string, auctionTitle: string, finalPrice: number, auctionId: string): Promise<void> {
    await this.createNotification(winnerId, {
      type: 'auction_won',
      title: 'Congratulations! You Won!',
      message: `You won the auction "${auctionTitle}" for €${finalPrice}`,
      data: {
        auctionId,
        auctionTitle,
        finalPrice
      }
    });
  }

  async notifyAuctionEnded(auctionOwnerId: string, auctionTitle: string, auctionId: string): Promise<void> {
    await this.createNotification(auctionOwnerId, {
      type: 'auction_ended',
      title: 'Auction Ended',
      message: `Your auction "${auctionTitle}" has ended`,
      data: {
        auctionId,
        auctionTitle
      }
    });
  }
}
```

### **5. Controller Implementation**

```typescript
// notification.controller.ts
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Req() req,
    @Query() query: GetNotificationsQuery
  ): Promise<NotificationResponse> {
    return await this.notificationService.getUserNotifications(req.user.id, query);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req): Promise<UnreadCountResponse> {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Req() req
  ): Promise<MarkAsReadResponse> {
    await this.notificationService.markAsRead(id, req.user.id);
    return { success: true };
  }

  @Put('mark-all-read')
  async markAllAsRead(@Req() req): Promise<MarkAllAsReadResponse> {
    await this.notificationService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Req() req
  ): Promise<DeleteNotificationResponse> {
    await this.notificationService.deleteNotification(id, req.user.id);
    return { success: true };
  }
}
```

### **6. Module Configuration**

```typescript
// notification.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    // ... other imports
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationModule {}
```

### **7. Integration Points**

**Bid Service Integration:**
```typescript
// In your bid service, after successfully placing a bid:
async placeBid(auctionId: string, bidAmount: number, bidderId: string): Promise<Bid> {
  // ... existing bid placement logic ...

  // Get auction details
  const auction = await this.auctionRepository.findOne({ where: { id: auctionId } });
  
  // Get bidder details
  const bidder = await this.userRepository.findOne({ where: { id: bidderId } });

  // Notify auction owner
  await this.notificationService.notifyBidPlaced(
    auction.ownerId,
    auction.title,
    bidAmount,
    bidder.name,
    auctionId
  );

  // Notify previous bidders they were outbid
  const previousBidders = await this.getPreviousBidders(auctionId, bidderId);
  for (const bidder of previousBidders) {
    await this.notificationService.notifyBidOutbid(
      bidder.id,
      auction.title,
      bidAmount,
      auctionId
    );
  }

  return bid;
}
```

**Offer Service Integration:**
```typescript
// In your offer service, after successfully creating an offer:
async createOffer(auctionId: string, offerData: CreateOfferDto, offererId: string): Promise<Offer> {
  // ... existing offer creation logic ...

  // Get auction and offerer details
  const auction = await this.auctionRepository.findOne({ where: { id: auctionId } });
  const offerer = await this.userRepository.findOne({ where: { id: offererId } });

  // Notify auction owner
  await this.notificationService.notifyOfferReceived(
    auction.ownerId,
    auction.title,
    offerData.amount,
    offerer.name,
    auctionId
  );

  return offer;
}

// When accepting an offer:
async acceptOffer(offerId: string): Promise<void> {
  // ... existing offer acceptance logic ...

  // Notify offer maker
  await this.notificationService.notifyOfferAccepted(
    offer.buyerId,
    auction.title,
    offer.amount,
    auctionId
  );
}

// When rejecting an offer:
async rejectOffer(offerId: string): Promise<void> {
  // ... existing offer rejection logic ...

  // Notify offer maker
  await this.notificationService.notifyOfferRejected(
    offer.buyerId,
    auction.title,
    offer.amount,
    auctionId
  );
}
```

**Auction Service Integration:**
```typescript
// When an auction ends:
async endAuction(auctionId: string): Promise<void> {
  // ... existing auction ending logic ...

  const auction = await this.auctionRepository.findOne({ where: { id: auctionId } });
  
  // Notify auction owner
  await this.notificationService.notifyAuctionEnded(
    auction.ownerId,
    auction.title,
    auctionId
  );

  // If there's a winner, notify them
  if (winningBid) {
    await this.notificationService.notifyAuctionWon(
      winningBid.bidderId,
      auction.title,
      winningBid.amount,
      auctionId
    );
  }
}
```

### **8. Testing Requirements**

Create comprehensive tests:

```typescript
// notification.service.spec.ts
describe('NotificationService', () => {
  // Test notification creation
  // Test notification retrieval with pagination
  // Test marking notifications as read
  // Test unread count functionality
  // Test notification deletion
  // Test integration with bid/offer services
});
```

### **9. Performance Considerations**

- Implement pagination (default 50 notifications per page)
- Add database indexes for common queries
- Consider implementing notification cleanup for old notifications (older than 90 days)
- Consider implementing notification batching for high-frequency events

### **10. Security Considerations**

- Ensure users can only access their own notifications
- Validate notification data before storage
- Implement rate limiting for notification creation
- Sanitize user input in notification messages

## **Expected Outcome**

After implementing this system:

1. **Bid Placement** - Auction owner receives notification, previous bidders get outbid notifications
2. **Offer Submission** - Auction owner receives offer notification
3. **Offer Response** - Offer maker receives accepted/rejected notification
4. **Auction End** - Winner and owner receive appropriate notifications
5. **Frontend Integration** - The existing frontend notification bell will automatically work

## **Priority**

This is a **high priority** feature as the frontend team has already implemented the UI and is waiting for backend support to complete the notification system.

## **Questions for Clarification**

If you need any clarification on:
- Database schema design
- API endpoint specifications
- Integration points with existing services
- Testing requirements

Please ask for specific details before proceeding with implementation.
