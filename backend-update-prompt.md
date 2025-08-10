# Backend Update Prompt for WH40K Auction System

## Overview
The frontend has been enhanced with comprehensive user profile management, address handling, and notification systems. The backend needs to be updated to support these new features and ensure proper authentication handling for the auction system.

## Current Issues to Address

### 1. Authentication & Authorization
- **Issue**: `showOwn=true` parameter in auction requests returns 401 Unauthorized
- **Error**: `"Authentication required to view your own auctions"`
- **Required**: Ensure JWT tokens are properly validated for `showOwn` requests
- **Endpoint**: `GET /api/v1/auctions?showOwn=true&sortBy=newest&page=1&limit=12`

### 2. Parameter Naming Consistency
- **Frontend uses**: `showOwn` (camelCase)
- **Backend should**: Accept both `showOwn` and `show_own` for backward compatibility
- **Priority**: High - affects core auction filtering functionality

## New Features to Implement

### 1. User Profile Management

#### 1.1 Get User Profile
```
GET /api/v1/users/profile
Authorization: Bearer <jwt_token>
Response: UserProfile object
```

**UserProfile Interface:**
```typescript
interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  addresses: UserAddress[];
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### 1.2 Update User Profile
```
PUT /api/v1/users/profile
Authorization: Bearer <jwt_token>
Body: UpdateProfileRequest
Response: Updated UserProfile
```

**UpdateProfileRequest Interface:**
```typescript
interface UpdateProfileRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    currency?: string;
  };
}
```

#### 1.3 Change Password
```
POST /api/v1/users/change-password
Authorization: Bearer <jwt_token>
Body: ChangePasswordRequest
Response: Success message
```

**ChangePasswordRequest Interface:**
```typescript
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

### 2. Address Management System

#### 2.1 User Address Interface
```typescript
interface UserAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 2.2 Address CRUD Operations

**Get User Addresses:**
```
GET /api/v1/users/addresses
Authorization: Bearer <jwt_token>
Response: UserAddress[]
```

**Add New Address:**
```
POST /api/v1/users/addresses
Authorization: Bearer <jwt_token>
Body: AddAddressRequest
Response: UserAddress
```

**AddAddressRequest Interface:**
```typescript
interface AddAddressRequest {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}
```

**Update Address:**
```
PUT /api/v1/users/addresses/{addressId}
Authorization: Bearer <jwt_token>
Body: UpdateAddressRequest
Response: UserAddress
```

**UpdateAddressRequest Interface:**
```typescript
interface UpdateAddressRequest {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}
```

**Delete Address:**
```
DELETE /api/v1/users/addresses/{addressId}
Authorization: Bearer <jwt_token>
Response: Success message
```

**Set Default Address:**
```
POST /api/v1/users/addresses/{addressId}/set-default
Authorization: Bearer <jwt_token>
Response: Success message
```

**Get User's Default Address:**
```
GET /api/v1/users/{userId}/default-address
Authorization: Bearer <jwt_token>
Response: UserAddress
```

### 3. Notification System

#### 3.1 Notification Interface
```typescript
interface Notification {
  id: string;
  type: 'auction_won' | 'offer_accepted' | 'bid_outbid' | 'auction_ending' | 'general';
  title: string;
  message: string;
  auctionId?: string;
  offerId?: string;
  recipientId: string;
  senderId?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    winnerAddress?: UserAddress;
    finalPrice?: number;
    shippingInfo?: any;
  };
}
```

#### 3.2 Notification Endpoints

**Get User Notifications:**
```
GET /api/v1/notifications
Authorization: Bearer <jwt_token>
Query Parameters: 
  - page: number
  - limit: number
  - unreadOnly: boolean
Response: { notifications: Notification[], total: number, unreadCount: number }
```

**Mark Notification as Read:**
```
PUT /api/v1/notifications/{notificationId}/read
Authorization: Bearer <jwt_token>
Response: Success message
```

**Mark All Notifications as Read:**
```
PUT /api/v1/notifications/read-all
Authorization: Bearer <jwt_token>
Response: Success message
```

**Delete Notification:**
```
DELETE /api/v1/notifications/{notificationId}
Authorization: Bearer <jwt_token>
Response: Success message
```

**Get Unread Count:**
```
GET /api/v1/notifications/unread-count
Authorization: Bearer <jwt_token>
Response: { count: number }
```

#### 3.3 Special Notification Endpoints

**Notify Auction Winner:**
```
POST /api/v1/auctions/{auctionId}/notify-winner
Authorization: Bearer <jwt_token>
Body: WinnerNotificationData
Response: Notification
```

**WinnerNotificationData Interface:**
```typescript
interface WinnerNotificationData {
  winnerId: string;
  winnerAddress: UserAddress;
  finalPrice: number;
  auctionTitle: string;
  message?: string;
}
```

**Notify Offer Accepted:**
```
POST /api/v1/offers/{offerId}/notify-accepted
Authorization: Bearer <jwt_token>
Body: OfferAcceptanceData
Response: Notification
```

**OfferAcceptanceData Interface:**
```typescript
interface OfferAcceptanceData {
  buyerId: string;
  buyerAddress: UserAddress;
  offerAmount: number;
  auctionTitle: string;
  message?: string;
}
```

### 4. Enhanced Auction Endpoints

#### 4.1 Auction Winner Information
```
GET /api/v1/auctions/{auctionId}/winner
Authorization: Bearer <jwt_token>
Response: { winner: User, winningBid: Bid, finalPrice: number }
```

#### 4.2 Winner Shipping Address
```
GET /api/v1/auctions/{auctionId}/winner-address
Authorization: Bearer <jwt_token>
Response: UserAddress
```

#### 4.3 Shipping Information
```
GET /api/v1/auctions/{auctionId}/shipping/{userId}
Authorization: Bearer <jwt_token>
Response: { shippingAddress: UserAddress, trackingInfo?: any }
```

### 5. Enhanced Offer Endpoints

#### 5.1 Accept Offer with Address
```
POST /api/v1/offers/{offerId}/accept-with-address
Authorization: Bearer <jwt_token>
Body: { response: 'accept', shippingAddress: UserAddress }
Response: { offer: Offer, notification: Notification }
```

## Database Schema Updates

### 1. Users Table Extensions
```sql
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN preferences JSON;
```

### 2. New Addresses Table
```sql
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, is_default);
```

### 3. New Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
```

## Security Considerations

### 1. Authentication Validation
- Ensure all endpoints properly validate JWT tokens
- Implement proper error handling for expired/invalid tokens
- Add rate limiting for sensitive operations (password changes, address updates)

### 2. Authorization Rules
- Users can only access their own profile and addresses
- Users can only view notifications sent to them
- Auction owners can only notify winners for their own auctions
- Offer owners can only accept offers for their own auctions

### 3. Data Validation
- Validate address formats and postal codes
- Ensure password strength requirements
- Validate email and phone number formats
- Sanitize user input to prevent injection attacks

## Error Handling

### 1. Standard Error Responses
```typescript
interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}
```

### 2. Common Error Codes
- `AUTH_REQUIRED_FOR_OWN_AUCTIONS`: 401 - User must be logged in to view own auctions
- `INVALID_ADDRESS_FORMAT`: 400 - Address validation failed
- `ADDRESS_NOT_FOUND`: 404 - Requested address doesn't exist
- `DUPLICATE_DEFAULT_ADDRESS`: 409 - User already has a default address
- `INVALID_PASSWORD`: 400 - Password doesn't meet requirements
- `CURRENT_PASSWORD_INCORRECT`: 400 - Current password is wrong
- `NOTIFICATION_NOT_FOUND`: 404 - Requested notification doesn't exist

## Testing Requirements

### 1. Unit Tests
- Test all new endpoints with valid and invalid data
- Test authentication and authorization rules
- Test address CRUD operations
- Test notification creation and management

### 2. Integration Tests
- Test complete user profile update flow
- Test address management with default address logic
- Test auction winner notification flow
- Test offer acceptance with address sharing

### 3. Security Tests
- Test JWT validation on all protected endpoints
- Test authorization rules for user data access
- Test input validation and sanitization
- Test rate limiting on sensitive operations

## Migration Strategy

### 1. Database Migration
- Create migration scripts for new tables and columns
- Ensure backward compatibility during migration
- Test migration on staging environment first

### 2. API Versioning
- Consider API versioning if breaking changes are needed
- Maintain backward compatibility for existing endpoints
- Document API changes clearly

### 3. Deployment
- Deploy database changes first
- Deploy backend API updates
- Update frontend to use new endpoints
- Monitor for any issues post-deployment

## Priority Implementation Order

1. **High Priority** (Fix current issues):
   - Fix `showOwn` authentication issue
   - Implement parameter name consistency

2. **Medium Priority** (Core features):
   - User profile management
   - Address management system
   - Basic notification system

3. **Low Priority** (Enhanced features):
   - Advanced notification features
   - Shipping information endpoints
   - Enhanced offer handling

## Contact Information
For any questions or clarifications about this prompt, please refer to the frontend implementation in the Angular codebase, particularly:
- `src/app/services/auth.service.ts` - Profile and address management
- `src/app/services/notification.service.ts` - Notification system
- `src/app/profile/` - Profile component implementation
- `src/app/auctions/` - Auction-related features

The frontend is ready to consume these APIs once they are implemented on the backend.
