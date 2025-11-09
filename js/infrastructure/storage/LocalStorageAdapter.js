class LocalStorageAdapter {
  constructor() {
    this.prefix = 'guitar-combat-';
  }

  getKey(collection, id = null) {
    if (id) {
      return `${this.prefix}${collection}:${id}`;
    }
    return `${this.prefix}${collection}`;
  }

  async get(collection, id) {
    try {
      const key = this.getKey(collection, id);
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to get item ${id} from collection ${collection}:`, error);
      return null;
    }
  }

  async set(collection, id, data) {
    try {
      const key = this.getKey(collection, id);
      const value = JSON.stringify(data);
      localStorage.setItem(key, value);
      return data;
    } catch (error) {
      console.error(`Failed to set item ${id} in collection ${collection}:`, error);
      throw error;
    }
  }

  async getAll(collection) {
    try {
      const prefix = this.getKey(collection);
      const items = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            items.push(JSON.parse(value));
          }
        }
      }
      
      return items;
    } catch (error) {
      console.error(`Failed to get all items from collection ${collection}:`, error);
      return [];
    }
  }

  async delete(collection, id) {
    try {
      const key = this.getKey(collection, id);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete item ${id} from collection ${collection}:`, error);
      return false;
    }
  }

  async clearCollection(collection) {
    try {
      const prefix = this.getKey(collection);
      const keysToDelete = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error(`Failed to clear collection ${collection}:`, error);
      return false;
    }
  }

  async clearAll() {
    try {
      const keysToDelete = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  async load(key) {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
      return null;
    }
  }

  async save(key, data) {
    try {
      const value = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, value);
      return true;
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      return false;
    }
  }
}

export default LocalStorageAdapter;