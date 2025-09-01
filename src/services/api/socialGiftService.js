// Mock data for missing database tables
const friendsData = [
  {
    Id: 1,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    photoUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b672?w=150",
    status: 'connected',
    mutualFriends: 5,
    joinedAt: '2024-01-15T10:30:00Z',
    lastActive: '2024-01-25T14:20:00Z'
  },
  {
    Id: 2,
    name: "Mike Chen",
    email: "mike@example.com", 
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    status: 'connected',
    mutualFriends: 3,
    joinedAt: '2024-01-20T09:15:00Z',
    lastActive: '2024-01-24T16:45:00Z'
  }
];

const sharedWishlistsData = [
  {
    Id: 1,
    title: "Wedding Registry",
    description: "Sarah & Tom's Wedding Wishlist",
    isPublic: true,
    allowContributions: true,
    createdBy: 'sarah@example.com',
    createdAt: '2024-01-10T10:00:00Z',
    collaborators: [
      { Id: 1, name: 'Sarah', email: 'sarah@example.com', role: 'owner' }
    ],
    items: []
  }
];

class SocialGiftService {
  constructor() {
    this.tableName = 'social_gift_c';
    this.friends = [...friendsData];
    this.sharedWishlists = [...sharedWishlistsData];
    
    // Initialize ApperClient for social gifts
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  }

  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getNextId(array) {
    return Math.max(...array.map(item => item.Id), 0) + 1;
  }

  // Friends functionality (mock service for missing friend_c table)
  async getFriends() {
    await this.delay();
    return [...this.friends];
  }

  async addFriend(friendData) {
    await this.delay();
    
    const newFriend = {
      Id: this.getNextId(this.friends),
      name: friendData.name,
      email: friendData.email,
      photoUrl: friendData.photoUrl || "",
      status: 'pending',
      mutualFriends: 0,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    this.friends.push(newFriend);
    return { ...newFriend };
  }

  async removeFriend(id) {
    await this.delay();
    
    const index = this.friends.findIndex(f => f.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Friend with ID ${id} not found`);
    }

    const deleted = this.friends.splice(index, 1)[0];
    return { ...deleted };
  }

  // Wishlist functionality (mock service for missing shared_wishlist_c table)
  async getSharedWishlists() {
    await this.delay();
    return [...this.sharedWishlists];
  }

  async createSharedWishlist(wishlistData) {
    await this.delay();
    
    const newWishlist = {
      Id: this.getNextId(this.sharedWishlists),
      title: wishlistData.title,
      description: wishlistData.description || '',
      isPublic: wishlistData.isPublic || false,
      allowContributions: wishlistData.allowContributions || true,
      createdBy: 'current-user@example.com',
      createdAt: new Date().toISOString(),
      collaborators: [{
        Id: 1,
        name: 'You',
        email: 'current-user@example.com',
        role: 'owner'
      }],
      items: []
    };

    this.sharedWishlists.push(newWishlist);
    return { ...newWishlist };
  }

  async updateWishlistPrivacy(id, isPublic) {
    await this.delay();
    
    const index = this.sharedWishlists.findIndex(w => w.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Wishlist with ID ${id} not found`);
    }

    this.sharedWishlists[index].isPublic = isPublic;
    return { ...this.sharedWishlists[index] };
  }

  async addItemToWishlist(wishlistId, item) {
    await this.delay();
    
    const wishlist = this.sharedWishlists.find(w => w.Id === parseInt(wishlistId));
    if (!wishlist) {
      throw new Error(`Wishlist with ID ${wishlistId} not found`);
    }

    const newItem = {
      Id: Math.max(...wishlist.items.map(i => i.Id || 0), 0) + 1,
      ...item,
      addedAt: new Date().toISOString(),
      addedBy: 'current-user@example.com'
    };

    wishlist.items.push(newItem);
    return newItem;
  }

  // Social gifts functionality (using database)
  async getGiftActivities() {
    try {
      await this.delay();
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "type_c" } },
          { field: { Name: "friend_id_c" } },
          { field: { Name: "friend_name_c" } },
          { field: { Name: "friend_photo_url_c" } },
          { field: { Name: "gift_id_c" } },
          { field: { Name: "gift_title_c" } },
          { field: { Name: "recipient_id_c" } },
          { field: { Name: "recipient_name_c" } },
          { field: { Name: "occasion_c" } },
          { field: { Name: "price_c" } },
          { field: { Name: "timestamp_c" } },
          { field: { Name: "privacy_c" } },
          { field: { Name: "notes_c" } },
          { field: { Name: "can_view_c" } }
        ],
        orderBy: [{ fieldName: "timestamp_c", sorttype: "DESC" }]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      // Transform database response to match UI expectations
      const activities = (response.data || []).map(record => ({
        Id: record.Id,
        type: record.type_c || 'shared',
        friendId: record.friend_id_c || 0,
        friendName: record.friend_name_c || '',
        friendPhotoUrl: record.friend_photo_url_c || '',
        giftId: record.gift_id_c || 0,
        giftTitle: record.gift_title_c || '',
        recipientId: record.recipient_id_c || null,
        recipientName: record.recipient_name_c || '',
        occasion: record.occasion_c || '',
        price: parseFloat(record.price_c) || null,
        timestamp: record.timestamp_c || record.CreatedOn,
        privacy: record.privacy_c || 'public',
        notes: record.notes_c || '',
        canView: record.can_view_c !== false,
        reactions: []
      }));

      return activities;
    } catch (error) {
      console.error("Error fetching gift activities:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async shareGift(giftId, friendIds, message = '') {
    try {
      await this.delay();
      
      const activities = [];
      for (const friendId of friendIds) {
        const friend = this.friends.find(f => f.Id === parseInt(friendId));
        
        const dbData = {
          Name: `Shared gift ${giftId}`,
          type_c: 'shared',
          friend_id_c: parseInt(friendId),
          friend_name_c: friend?.name || 'Unknown Friend',
          friend_photo_url_c: friend?.photoUrl || '',
          gift_id_c: parseInt(giftId),
          gift_title_c: `Gift #${giftId}`,
          recipient_id_c: null,
          recipient_name_c: '',
          timestamp_c: new Date().toISOString(),
          privacy_c: 'public',
          notes_c: message,
          can_view_c: true
        };

        const params = { records: [dbData] };
        const response = await this.apperClient.createRecord(this.tableName, params);
        
        if (response.success && response.results) {
          const successfulRecords = response.results.filter(result => result.success);
          if (successfulRecords.length > 0) {
            const createdRecord = successfulRecords[0].data;
            activities.push({
              Id: createdRecord.Id,
              type: createdRecord.type_c,
              friendId: createdRecord.friend_id_c,
              friendName: createdRecord.friend_name_c,
              friendPhotoUrl: createdRecord.friend_photo_url_c,
              giftId: createdRecord.gift_id_c,
              giftTitle: createdRecord.gift_title_c,
              recipientId: null,
              recipientName: '',
              timestamp: createdRecord.timestamp_c,
              privacy: createdRecord.privacy_c,
              message: createdRecord.notes_c,
              canView: true,
              reactions: []
            });
          }
        }
      }

      return activities;
    } catch (error) {
      console.error("Error sharing gift:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async recordGiftActivity(activityData) {
    try {
      await this.delay();
      
      const dbData = {
        Name: `${activityData.type} activity`,
        type_c: activityData.type || 'shared',
        friend_id_c: parseInt(activityData.friendId),
        friend_name_c: activityData.friendName,
        friend_photo_url_c: activityData.friendPhotoUrl || '',
        gift_id_c: parseInt(activityData.giftId),
        gift_title_c: activityData.giftTitle,
        recipient_id_c: activityData.recipientId ? parseInt(activityData.recipientId) : null,
        recipient_name_c: activityData.recipientName || '',
        occasion_c: activityData.occasion || '',
        price_c: activityData.price || null,
        timestamp_c: new Date().toISOString(),
        privacy_c: activityData.privacy || 'public',
        notes_c: activityData.notes || '',
        can_view_c: activityData.canView !== false
      };

      const params = { records: [dbData] };
      const response = await this.apperClient.createRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        if (successfulRecords.length > 0) {
          const createdRecord = successfulRecords[0].data;
          return {
            Id: createdRecord.Id,
            type: createdRecord.type_c,
            friendId: createdRecord.friend_id_c,
            friendName: createdRecord.friend_name_c,
            friendPhotoUrl: createdRecord.friend_photo_url_c,
            giftId: createdRecord.gift_id_c,
            giftTitle: createdRecord.gift_title_c,
            recipientId: createdRecord.recipient_id_c,
            recipientName: createdRecord.recipient_name_c,
            occasion: createdRecord.occasion_c,
            price: parseFloat(createdRecord.price_c) || null,
            timestamp: createdRecord.timestamp_c,
            privacy: createdRecord.privacy_c,
            notes: createdRecord.notes_c,
            canView: createdRecord.can_view_c,
            reactions: []
          };
        }
      }
    } catch (error) {
      console.error("Error recording gift activity:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async getSocialStats() {
    await this.delay();
    
    const stats = {
      totalFriends: this.friends.length,
      connectedFriends: this.friends.filter(f => f.status === 'connected').length,
      totalWishlists: this.sharedWishlists.length,
      publicWishlists: this.sharedWishlists.filter(w => w.isPublic).length,
      recentActivities: 0 // Would be calculated from database activities
    };

    return stats;
  }
}

export const socialGiftService = new SocialGiftService();