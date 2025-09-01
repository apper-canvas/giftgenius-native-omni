class SavedGiftService {
  constructor() {
    this.tableName = 'saved_gift_c';
    // Initialize ApperClient with Project ID and Public Key
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAll() {
    try {
      await this.delay(250);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "saved_date_c" } },
          { field: { Name: "notes_c" } },
          { field: { Name: "price_alert_c" } },
          { field: { Name: "gift_c" } },
          { field: { Name: "recipient_c" } }
        ],
        orderBy: [{ fieldName: "saved_date_c", sorttype: "DESC" }]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      // Transform database response to match UI expectations
      const savedGifts = (response.data || []).map(record => ({
        Id: record.Id,
        savedDate: record.saved_date_c || record.CreatedOn,
        notes: record.notes_c || '',
        priceAlert: record.price_alert_c || false,
        giftId: record.gift_c?.Id || null,
        recipientId: record.recipient_c?.Id || null,
        gift: record.gift_c ? {
          Id: record.gift_c.Id,
          title: record.gift_c.Name || '',
          // Additional gift details would come from gift service if needed
        } : null,
        recipient: record.recipient_c ? {
          Id: record.recipient_c.Id,
          name: record.recipient_c.Name || ''
        } : null
      }));

      return savedGifts;
    } catch (error) {
      console.error("Error fetching saved gifts:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async getById(id) {
    try {
      await this.delay(150);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "saved_date_c" } },
          { field: { Name: "notes_c" } },
          { field: { Name: "price_alert_c" } },
          { field: { Name: "gift_c" } },
          { field: { Name: "recipient_c" } }
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, parseInt(id), params);
      
      if (!response.success || !response.data) {
        return null;
      }

      // Transform database response to match UI expectations
      const savedGift = {
        Id: response.data.Id,
        savedDate: response.data.saved_date_c || response.data.CreatedOn,
        notes: response.data.notes_c || '',
        priceAlert: response.data.price_alert_c || false,
        giftId: response.data.gift_c?.Id || null,
        recipientId: response.data.recipient_c?.Id || null,
        gift: response.data.gift_c ? {
          Id: response.data.gift_c.Id,
          title: response.data.gift_c.Name || ''
        } : null,
        recipient: response.data.recipient_c ? {
          Id: response.data.recipient_c.Id,
          name: response.data.recipient_c.Name || ''
        } : null
      };

      return savedGift;
    } catch (error) {
      console.error(`Error fetching saved gift with ID ${id}:`, error?.response?.data?.message || error.message);
      return null;
    }
  }

  async getByRecipient(recipientId) {
    try {
      await this.delay(200);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "saved_date_c" } },
          { field: { Name: "notes_c" } },
          { field: { Name: "price_alert_c" } },
          { field: { Name: "gift_c" } },
          { field: { Name: "recipient_c" } }
        ],
        where: [
          {
            FieldName: "recipient_c",
            Operator: "EqualTo",
            Values: [parseInt(recipientId)]
          }
        ],
        orderBy: [{ fieldName: "saved_date_c", sorttype: "DESC" }]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(record => ({
        Id: record.Id,
        savedDate: record.saved_date_c || record.CreatedOn,
        notes: record.notes_c || '',
        priceAlert: record.price_alert_c || false,
        giftId: record.gift_c?.Id || null,
        recipientId: record.recipient_c?.Id || null,
        gift: record.gift_c ? {
          Id: record.gift_c.Id,
          title: record.gift_c.Name || ''
        } : null,
        recipient: record.recipient_c ? {
          Id: record.recipient_c.Id,
          name: record.recipient_c.Name || ''
        } : null
      }));
    } catch (error) {
      console.error("Error fetching saved gifts by recipient:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async create(savedGiftData) {
    try {
      await this.delay(300);
      
      // Check if gift is already saved for this recipient
      const existingGifts = await this.getByRecipient(savedGiftData.recipientId);
      const existing = existingGifts.find(sg => 
        sg.giftId === savedGiftData.giftId && sg.recipientId === savedGiftData.recipientId
      );
      
      if (existing) {
        throw new Error("Gift is already saved for this recipient");
      }
      
      // Transform UI data to database format - only include Updateable fields
      const dbData = {
        Name: savedGiftData.name || `Saved Gift ${savedGiftData.giftId}`,
        saved_date_c: new Date().toISOString(),
        notes_c: savedGiftData.notes || '',
        price_alert_c: savedGiftData.priceAlert || false,
        gift_c: parseInt(savedGiftData.giftId),
        recipient_c: parseInt(savedGiftData.recipientId)
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
          console.error(`Failed to create saved gift ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        }
        
        if (successfulRecords.length > 0) {
          const createdRecord = successfulRecords[0].data;
          return {
            Id: createdRecord.Id,
            savedDate: createdRecord.saved_date_c,
            notes: createdRecord.notes_c || '',
            priceAlert: createdRecord.price_alert_c || false,
            giftId: createdRecord.gift_c,
            recipientId: createdRecord.recipient_c
          };
        }
      }
    } catch (error) {
      console.error("Error creating saved gift:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async update(id, savedGiftData) {
    try {
      await this.delay(250);
      
      // Transform UI data to database format - only include Updateable fields
      const dbData = {
        Id: parseInt(id),
        notes_c: savedGiftData.notes || '',
        price_alert_c: savedGiftData.priceAlert || false
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
          console.error(`Failed to update saved gift ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        }
        
        if (successfulUpdates.length > 0) {
          const updatedRecord = successfulUpdates[0].data;
          return {
            Id: updatedRecord.Id,
            savedDate: updatedRecord.saved_date_c,
            notes: updatedRecord.notes_c || '',
            priceAlert: updatedRecord.price_alert_c || false,
            giftId: updatedRecord.gift_c,
            recipientId: updatedRecord.recipient_c
          };
        }
      }
    } catch (error) {
      console.error("Error updating saved gift:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      await this.delay(200);
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
          console.error(`Failed to delete saved gift ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        }
        
        return successfulDeletions.length === 1;
      }
    } catch (error) {
      console.error("Error deleting saved gift:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async togglePriceAlert(id) {
    try {
      await this.delay(200);
      const savedGift = await this.getById(id);
      if (!savedGift) throw new Error("Saved gift not found");
      
      return this.update(id, { priceAlert: !savedGift.priceAlert });
    } catch (error) {
      console.error("Error toggling price alert:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async addNote(id, note) {
    try {
      await this.delay(200);
      return this.update(id, { notes: note });
    } catch (error) {
      console.error("Error adding note:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async getPriceAlerts() {
    try {
      await this.delay(200);
      const allSavedGifts = await this.getAll();
      return allSavedGifts.filter(savedGift => savedGift.priceAlert);
    } catch (error) {
      console.error("Error getting price alerts:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async createPriceAlert(savedGiftId, alertConfig) {
    try {
      await this.delay(300);
      const savedGift = await this.getById(savedGiftId);
      if (!savedGift) throw new Error("Saved gift not found");

      // Import priceAlertService dynamically to avoid circular dependency
      const { priceAlertService } = await import('./priceAlertService.js');
      
      const alertData = {
        giftId: savedGift.giftId,
        recipientId: savedGift.recipientId,
        ...alertConfig
      };

      return await priceAlertService.create(alertData);
    } catch (error) {
      console.error("Error creating price alert:", error?.response?.data?.message || error.message);
      throw error;
    }
  }
}

export const savedGiftService = new SavedGiftService();