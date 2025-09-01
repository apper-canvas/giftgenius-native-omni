class GroupGiftService {
  constructor() {
    this.tableName = 'group_gift_c';
    // Initialize ApperClient with Project ID and Public Key
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  }

  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAll() {
    try {
      await this.delay();
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "target_amount_c" } },
          { field: { Name: "current_amount_c" } },
          { field: { Name: "deadline_c" } },
          { field: { Name: "status_c" } },
          { field: { Name: "occasion_type_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "created_by_c" } },
          { field: { Name: "recipient_c" } },
          { field: { Name: "gift_c" } }
        ],
        orderBy: [{ fieldName: "Id", sorttype: "DESC" }]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      // Transform database response to match UI expectations
      const groupGifts = (response.data || []).map(record => ({
        Id: record.Id,
        title: record.title_c || record.Name || '',
        description: record.description_c || '',
        targetAmount: parseFloat(record.target_amount_c) || 0,
        currentAmount: parseFloat(record.current_amount_c) || 0,
        deadline: record.deadline_c || '',
        status: record.status_c || 'active',
        occasionType: record.occasion_type_c || 'General',
        createdAt: record.created_at_c || record.CreatedOn,
        createdBy: record.created_by_c || '',
        recipientId: record.recipient_c?.Id || null,
        giftId: record.gift_c?.Id || null,
        contributors: [], // Will be populated from contribution records
        invitedContributors: [] // Will be populated from invitation records
      }));

      return groupGifts;
    } catch (error) {
      console.error("Error fetching group gifts:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async getById(id) {
    try {
      await this.delay();
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "target_amount_c" } },
          { field: { Name: "current_amount_c" } },
          { field: { Name: "deadline_c" } },
          { field: { Name: "status_c" } },
          { field: { Name: "occasion_type_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "created_by_c" } },
          { field: { Name: "recipient_c" } },
          { field: { Name: "gift_c" } }
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, parseInt(id), params);
      
      if (!response.success || !response.data) {
        throw new Error(`Group gift with ID ${id} not found`);
      }

      // Transform database response to match UI expectations
      const groupGift = {
        Id: response.data.Id,
        title: response.data.title_c || response.data.Name || '',
        description: response.data.description_c || '',
        targetAmount: parseFloat(response.data.target_amount_c) || 0,
        currentAmount: parseFloat(response.data.current_amount_c) || 0,
        deadline: response.data.deadline_c || '',
        status: response.data.status_c || 'active',
        occasionType: response.data.occasion_type_c || 'General',
        createdAt: response.data.created_at_c || response.data.CreatedOn,
        createdBy: response.data.created_by_c || '',
        recipientId: response.data.recipient_c?.Id || null,
        giftId: response.data.gift_c?.Id || null,
        contributors: [], // Mock data for now
        invitedContributors: [] // Mock data for now
      };

      return groupGift;
    } catch (error) {
      console.error(`Error fetching group gift with ID ${id}:`, error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async getByRecipient(recipientId) {
    try {
      await this.delay();
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "target_amount_c" } },
          { field: { Name: "current_amount_c" } },
          { field: { Name: "deadline_c" } },
          { field: { Name: "status_c" } },
          { field: { Name: "occasion_type_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "created_by_c" } },
          { field: { Name: "recipient_c" } },
          { field: { Name: "gift_c" } }
        ],
        where: [
          {
            FieldName: "recipient_c",
            Operator: "EqualTo",
            Values: [parseInt(recipientId)]
          }
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(record => ({
        Id: record.Id,
        title: record.title_c || record.Name || '',
        description: record.description_c || '',
        targetAmount: parseFloat(record.target_amount_c) || 0,
        currentAmount: parseFloat(record.current_amount_c) || 0,
        deadline: record.deadline_c || '',
        status: record.status_c || 'active',
        occasionType: record.occasion_type_c || 'General',
        createdAt: record.created_at_c || record.CreatedOn,
        createdBy: record.created_by_c || '',
        recipientId: record.recipient_c?.Id || null,
        giftId: record.gift_c?.Id || null,
        contributors: [],
        invitedContributors: []
      }));
    } catch (error) {
      console.error("Error fetching group gifts by recipient:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async create(groupGiftData) {
    try {
      await this.delay();
      
      // Transform UI data to database format - only include Updateable fields
      const dbData = {
        Name: groupGiftData.title || '',
        title_c: groupGiftData.title || '',
        description_c: groupGiftData.description || '',
        target_amount_c: parseFloat(groupGiftData.targetAmount) || 0,
        current_amount_c: 0,
        deadline_c: groupGiftData.deadline || '',
        status_c: 'active',
        occasion_type_c: groupGiftData.occasionType || 'General',
        created_at_c: new Date().toISOString(),
        created_by_c: groupGiftData.createdBy || '',
        recipient_c: parseInt(groupGiftData.recipientId),
        gift_c: groupGiftData.giftId ? parseInt(groupGiftData.giftId) : null
      };

      const params = {
        records: [dbData]
      };

      const response = await this.apperClient.createRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create group gift ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        }
        
        if (successfulRecords.length > 0) {
          const createdRecord = successfulRecords[0].data;
          return {
            Id: createdRecord.Id,
            title: createdRecord.title_c || createdRecord.Name || '',
            description: createdRecord.description_c || '',
            targetAmount: parseFloat(createdRecord.target_amount_c) || 0,
            currentAmount: parseFloat(createdRecord.current_amount_c) || 0,
            deadline: createdRecord.deadline_c || '',
            status: createdRecord.status_c || 'active',
            occasionType: createdRecord.occasion_type_c || 'General',
            createdAt: createdRecord.created_at_c,
            createdBy: createdRecord.created_by_c || '',
            recipientId: createdRecord.recipient_c,
            giftId: createdRecord.gift_c,
            contributors: [],
            invitedContributors: groupGiftData.invitedContributors || []
          };
        }
      }
    } catch (error) {
      console.error("Error creating group gift:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async update(id, groupGiftData) {
    try {
      await this.delay();
      
      // Transform UI data to database format - only include Updateable fields
      const dbData = {
        Id: parseInt(id),
        title_c: groupGiftData.title || '',
        description_c: groupGiftData.description || '',
        target_amount_c: parseFloat(groupGiftData.targetAmount) || 0,
        current_amount_c: parseFloat(groupGiftData.currentAmount) || 0,
        deadline_c: groupGiftData.deadline || '',
        status_c: groupGiftData.status || 'active',
        occasion_type_c: groupGiftData.occasionType || 'General'
      };

      const params = {
        records: [dbData]
      };

      const response = await this.apperClient.updateRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulUpdates = response.results.filter(result => result.success);
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update group gift ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        }
        
        if (successfulUpdates.length > 0) {
          const updatedRecord = successfulUpdates[0].data;
          return {
            Id: updatedRecord.Id,
            title: updatedRecord.title_c || updatedRecord.Name || '',
            description: updatedRecord.description_c || '',
            targetAmount: parseFloat(updatedRecord.target_amount_c) || 0,
            currentAmount: parseFloat(updatedRecord.current_amount_c) || 0,
            deadline: updatedRecord.deadline_c || '',
            status: updatedRecord.status_c || 'active',
            occasionType: updatedRecord.occasion_type_c || 'General',
            createdAt: updatedRecord.created_at_c,
            createdBy: updatedRecord.created_by_c || '',
            recipientId: updatedRecord.recipient_c,
            giftId: updatedRecord.gift_c,
            contributors: groupGiftData.contributors || [],
            invitedContributors: groupGiftData.invitedContributors || []
          };
        }
      }
    } catch (error) {
      console.error("Error updating group gift:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      await this.delay();
      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await this.apperClient.deleteRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulDeletions = response.results.filter(result => result.success);
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete group gift ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        }
        
        return successfulDeletions.length === 1;
      }
    } catch (error) {
      console.error("Error deleting group gift:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  // Mock functionality for contribution management
  // In a real implementation, these would use separate contribution tables
  async addContribution(id, contributionData) {
    try {
      await this.delay();
      
      const groupGift = await this.getById(id);
      if (!groupGift) {
        throw new Error(`Group gift with ID ${id} not found`);
      }
      
      const newAmount = groupGift.currentAmount + parseFloat(contributionData.amount);
      const newStatus = newAmount >= groupGift.targetAmount ? 'completed' : 'active';
      
      // Update the group gift with new contribution amount
      const updatedGroupGift = await this.update(id, {
        ...groupGift,
        currentAmount: newAmount,
        status: newStatus
      });
      
      // Mock contribution object
      const newContribution = {
        Id: Date.now(),
        name: contributionData.name,
        email: contributionData.email,
        amount: parseFloat(contributionData.amount),
        contributedAt: new Date().toISOString(),
        message: contributionData.message || ''
      };
      
      return newContribution;
    } catch (error) {
      console.error("Error adding contribution:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async inviteContributors(id, invitations) {
    await this.delay();
    
    const newInvitations = invitations.map(invitation => ({
      email: invitation.email,
      name: invitation.name || invitation.email,
      invitedAt: new Date().toISOString(),
      status: 'pending'
    }));
    
    return newInvitations;
  }

  async removeInvitation(id, email) {
    await this.delay();
    return true;
  }

  async getContributionStats() {
    try {
      await this.delay();
      const allGroupGifts = await this.getAll();
      
      const stats = {
        totalGroupGifts: allGroupGifts.length,
        activeGroupGifts: allGroupGifts.filter(g => g.status === 'active').length,
        completedGroupGifts: allGroupGifts.filter(g => g.status === 'completed').length,
        totalAmount: allGroupGifts.reduce((sum, g) => sum + g.currentAmount, 0),
        averageContribution: 0,
        totalContributors: 0
      };
      
      return stats;
    } catch (error) {
      console.error("Error getting contribution stats:", error?.response?.data?.message || error.message);
      return {
        totalGroupGifts: 0,
        activeGroupGifts: 0,
        completedGroupGifts: 0,
        totalAmount: 0,
        averageContribution: 0,
        totalContributors: 0
      };
    }
  }
}

export const groupGiftService = new GroupGiftService();