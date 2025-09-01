class PriceAlertService {
  constructor() {
    this.tableName = 'price_alert_c';
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
      await this.delay(200);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "enabled_c" } },
          { field: { Name: "price_drop_threshold_c" } },
          { field: { Name: "absolute_threshold_c" } },
          { field: { Name: "stock_alerts_c" } },
          { field: { Name: "email_enabled_c" } },
          { field: { Name: "push_enabled_c" } },
          { field: { Name: "frequency_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "last_triggered_c" } },
          { field: { Name: "total_savings_c" } },
          { field: { Name: "gift_c" } },
          { field: { Name: "recipient_c" } }
        ],
        orderBy: [{ fieldName: "Id", sorttype: "DESC" }]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      // Transform database response to match UI expectations
      const alerts = (response.data || []).map(record => ({
        Id: record.Id,
        enabled: record.enabled_c || false,
        priceDropThreshold: parseInt(record.price_drop_threshold_c) || 10,
        absoluteThreshold: parseFloat(record.absolute_threshold_c) || 0,
        stockAlerts: record.stock_alerts_c !== false,
        emailEnabled: record.email_enabled_c !== false,
        pushEnabled: record.push_enabled_c !== false,
        frequency: record.frequency_c || 'immediate',
        createdAt: record.created_at_c || record.CreatedOn,
        lastTriggered: record.last_triggered_c || null,
        totalSavings: parseFloat(record.total_savings_c) || 0,
        giftId: record.gift_c?.Id || null,
        recipientId: record.recipient_c?.Id || null,
        gift: record.gift_c ? {
          Id: record.gift_c.Id,
          title: record.gift_c.Name || '',
          price: 0 // Will be populated from gift service if needed
        } : null,
        recipient: record.recipient_c ? {
          Id: record.recipient_c.Id,
          name: record.recipient_c.Name || ''
        } : null
      }));

      return alerts;
    } catch (error) {
      console.error("Error fetching price alerts:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async getById(id) {
    try {
      await this.delay(150);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "enabled_c" } },
          { field: { Name: "price_drop_threshold_c" } },
          { field: { Name: "absolute_threshold_c" } },
          { field: { Name: "stock_alerts_c" } },
          { field: { Name: "email_enabled_c" } },
          { field: { Name: "push_enabled_c" } },
          { field: { Name: "frequency_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "last_triggered_c" } },
          { field: { Name: "total_savings_c" } },
          { field: { Name: "gift_c" } },
          { field: { Name: "recipient_c" } }
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, parseInt(id), params);
      
      if (!response.success || !response.data) {
        return null;
      }

      // Transform database response to match UI expectations
      const alert = {
        Id: response.data.Id,
        enabled: response.data.enabled_c || false,
        priceDropThreshold: parseInt(response.data.price_drop_threshold_c) || 10,
        absoluteThreshold: parseFloat(response.data.absolute_threshold_c) || 0,
        stockAlerts: response.data.stock_alerts_c !== false,
        emailEnabled: response.data.email_enabled_c !== false,
        pushEnabled: response.data.push_enabled_c !== false,
        frequency: response.data.frequency_c || 'immediate',
        createdAt: response.data.created_at_c || response.data.CreatedOn,
        lastTriggered: response.data.last_triggered_c || null,
        totalSavings: parseFloat(response.data.total_savings_c) || 0,
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

      return alert;
    } catch (error) {
      console.error(`Error fetching price alert with ID ${id}:`, error?.response?.data?.message || error.message);
      return null;
    }
  }

  async create(alertData) {
    try {
      await this.delay(300);
      
      // Transform UI data to database format - only include Updateable fields
      const dbData = {
        Name: alertData.name || `Alert for ${alertData.giftId}`,
        enabled_c: alertData.enabled !== false,
        price_drop_threshold_c: parseInt(alertData.priceDropThreshold) || 10,
        absolute_threshold_c: parseFloat(alertData.absoluteThreshold) || 0,
        stock_alerts_c: alertData.stockAlerts !== false,
        email_enabled_c: alertData.emailEnabled !== false,
        push_enabled_c: alertData.pushEnabled !== false,
        frequency_c: alertData.frequency || 'immediate',
        created_at_c: new Date().toISOString(),
        last_triggered_c: null,
        total_savings_c: 0,
        gift_c: parseInt(alertData.giftId),
        recipient_c: parseInt(alertData.recipientId)
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
          console.error(`Failed to create price alert ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        }
        
        if (successfulRecords.length > 0) {
          const createdRecord = successfulRecords[0].data;
          return {
            Id: createdRecord.Id,
            enabled: createdRecord.enabled_c || false,
            priceDropThreshold: parseInt(createdRecord.price_drop_threshold_c) || 10,
            absoluteThreshold: parseFloat(createdRecord.absolute_threshold_c) || 0,
            stockAlerts: createdRecord.stock_alerts_c !== false,
            emailEnabled: createdRecord.email_enabled_c !== false,
            pushEnabled: createdRecord.push_enabled_c !== false,
            frequency: createdRecord.frequency_c || 'immediate',
            createdAt: createdRecord.created_at_c,
            lastTriggered: null,
            totalSavings: 0,
            giftId: createdRecord.gift_c,
            recipientId: createdRecord.recipient_c
          };
        }
      }
    } catch (error) {
      console.error("Error creating price alert:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async update(id, alertData) {
    return this.updateConfig(id, alertData);
  }

  async updateConfig(id, config) {
    try {
      await this.delay(250);
      
      // Transform UI data to database format - only include Updateable fields
      const dbData = {
        Id: parseInt(id),
        enabled_c: config.enabled,
        price_drop_threshold_c: parseInt(config.priceDropThreshold) || 10,
        absolute_threshold_c: parseFloat(config.absoluteThreshold) || 0,
        stock_alerts_c: config.stockAlerts,
        email_enabled_c: config.emailEnabled,
        push_enabled_c: config.pushEnabled,
        frequency_c: config.frequency || 'immediate'
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
          console.error(`Failed to update price alert ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        }
        
        if (successfulUpdates.length > 0) {
          const updatedRecord = successfulUpdates[0].data;
          return {
            Id: updatedRecord.Id,
            enabled: updatedRecord.enabled_c || false,
            priceDropThreshold: parseInt(updatedRecord.price_drop_threshold_c) || 10,
            absoluteThreshold: parseFloat(updatedRecord.absolute_threshold_c) || 0,
            stockAlerts: updatedRecord.stock_alerts_c !== false,
            emailEnabled: updatedRecord.email_enabled_c !== false,
            pushEnabled: updatedRecord.push_enabled_c !== false,
            frequency: updatedRecord.frequency_c || 'immediate',
            createdAt: updatedRecord.created_at_c,
            lastTriggered: updatedRecord.last_triggered_c,
            totalSavings: parseFloat(updatedRecord.total_savings_c) || 0,
            giftId: updatedRecord.gift_c,
            recipientId: updatedRecord.recipient_c
          };
        }
      }
    } catch (error) {
      console.error("Error updating price alert config:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async toggleAlert(id) {
    try {
      await this.delay(200);
      // First get the current alert
      const alert = await this.getById(id);
      if (!alert) throw new Error("Alert not found");
      
      // Toggle the enabled status
      return this.updateConfig(id, { ...alert, enabled: !alert.enabled });
    } catch (error) {
      console.error("Error toggling price alert:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      await this.delay(250);
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
          console.error(`Failed to delete price alert ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        }
        
        return successfulDeletions.length === 1;
      }
    } catch (error) {
      console.error("Error deleting price alert:", error?.response?.data?.message || error.message);
      throw error;
    }
  }

  async getNotificationSettings() {
    await this.delay(150);
    // Return default settings - in real implementation, this could be user-specific
    return {
      emailEnabled: true,
      pushEnabled: true,
      frequency: 'immediate',
      priceDropThreshold: 10,
      absoluteThreshold: 0,
      stockAlerts: true
    };
  }

  async updateNotificationSettings(settings) {
    await this.delay(250);
    // In real implementation, this would update user preferences
    return settings;
  }
}

export const priceAlertService = new PriceAlertService();