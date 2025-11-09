class FileStorageAdapter {
  constructor() {
    this.data = new Map();
  }

  async get(collection, id) {
    try {
      const collectionData = this.data.get(collection);
      if (!collectionData) {
        return null;
      }
      return collectionData.get(id) || null;
    } catch (error) {
      console.error(`Failed to get item ${id} from collection ${collection}:`, error);
      return null;
    }
  }

  async set(collection, id, data) {
    try {
      if (!this.data.has(collection)) {
        this.data.set(collection, new Map());
      }
      
      const collectionData = this.data.get(collection);
      collectionData.set(id, data);
      return data;
    } catch (error) {
      console.error(`Failed to set item ${id} in collection ${collection}:`, error);
      throw error;
    }
  }

  async getAll(collection) {
    try {
      const collectionData = this.data.get(collection);
      if (!collectionData) {
        return [];
      }
      return Array.from(collectionData.values());
    } catch (error) {
      console.error(`Failed to get all items from collection ${collection}:`, error);
      return [];
    }
  }

  async delete(collection, id) {
    try {
      const collectionData = this.data.get(collection);
      if (!collectionData) {
        return false;
      }
      
      const deleted = collectionData.delete(id);
      return deleted;
    } catch (error) {
      console.error(`Failed to delete item ${id} from collection ${collection}:`, error);
      return false;
    }
  }

  async clearCollection(collection) {
    try {
      this.data.delete(collection);
      return true;
    } catch (error) {
      console.error(`Failed to clear collection ${collection}:`, error);
      return false;
    }
  }

  async clearAll() {
    try {
      this.data.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  async exportToFile() {
    try {
      const exportData = {};
      for (const [collection, collectionData] of this.data.entries()) {
        exportData[collection] = Array.from(collectionData.entries());
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `guitar-combat-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Failed to export data:', error);
      return false;
    }
  }

  async importFromFile(file) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      this.data.clear();
      
      for (const [collection, items] of Object.entries(importData)) {
        const collectionData = new Map();
        for (const [id, data] of items) {
          collectionData.set(id, data);
        }
        this.data.set(collection, collectionData);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

export default FileStorageAdapter;