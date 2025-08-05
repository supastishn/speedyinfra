import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as offlineDB from './offlineDB';

const TEST_TABLE = 'products';

describe('offlineDB', () => {
  const sampleData = [
    { _id: '1', name: 'Laptop', category: 'electronics', price: 1200 },
    { _id: '2', name: 'T-shirt', category: 'clothing', price: 25 },
    { _id: '3', name: 'Book', category: 'books', price: 15 },
    { _id: '4', name: 'Headphones', category: 'electronics', price: 150 },
    { _id: '5', name: 'Jeans', category: 'clothing', price: 75 },
  ];

  beforeEach(async () => {
    await offlineDB.clearAllData();
    // Re-inserting data generates new IDs and timestamps, so we just add the core data
    const tx = [];
    for (const item of sampleData) {
      tx.push(offlineDB.addTableItem(TEST_TABLE, item));
    }
    await Promise.all(tx);
  });

  afterAll(async () => {
    await offlineDB.clearAllData();
  });

  describe('queryTable', () => {
    it('should return all items with no query', async () => {
      const { data, totalCount } = await offlineDB.queryTable(TEST_TABLE, {});
      expect(totalCount).toBe(sampleData.length);
      expect(data.length).toBe(sampleData.length);
    });

    it('should filter items by a single property', async () => {
      const { data, totalCount } = await offlineDB.queryTable(TEST_TABLE, { category: 'electronics' });
      expect(totalCount).toBe(2);
      expect(data.every(item => item.category === 'electronics')).toBe(true);
    });

    it('should filter with _gte operator', async () => {
      const { data } = await offlineDB.queryTable(TEST_TABLE, { price_gte: 100 });
      expect(data.length).toBe(2);
      expect(data.every(item => item.price >= 100)).toBe(true);
    });

    it('should filter with _lte operator', async () => {
        const { data } = await offlineDB.queryTable(TEST_TABLE, { price_lte: 50 });
        expect(data.length).toBe(2);
        expect(data.every(item => item.price <= 50)).toBe(true);
    });

    it('should filter with _ne operator', async () => {
        const { data } = await offlineDB.queryTable(TEST_TABLE, { category_ne: 'clothing' });
        expect(data.length).toBe(3);
        expect(data.every(item => item.category !== 'clothing')).toBe(true);
    });

    it('should handle multiple filters', async () => {
      const { data } = await offlineDB.queryTable(TEST_TABLE, { category: 'clothing', price_gte: 50 });
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Jeans');
    });

    it('should sort items in ascending order', async () => {
      const { data } = await offlineDB.queryTable(TEST_TABLE, { _sort: 'price', _order: 'asc' });
      const prices = data.map(item => item.price);
      expect(prices).toEqual([15, 25, 75, 150, 1200]);
    });

    it('should sort items in descending order', async () => {
      const { data } = await offlineDB.queryTable(TEST_TABLE, { _sort: 'price', _order: 'desc' });
      const prices = data.map(item => item.price);
      expect(prices).toEqual([1200, 150, 75, 25, 15]);
    });

    it('should handle pagination', async () => {
      const { data, totalCount } = await offlineDB.queryTable(TEST_TABLE, { _page: 2, _limit: 2, _sort: 'price', _order: 'asc' });
      expect(totalCount).toBe(5);
      expect(data.length).toBe(2);
      expect(data.map(i => i.name)).toEqual(['Jeans', 'Headphones']);
    });

    it('should handle pagination and filtering combined', async () => {
        const { data, totalCount } = await offlineDB.queryTable(TEST_TABLE, { category: 'electronics', _page: 1, _limit: 1, _sort: 'price', _order: 'desc' });
        expect(totalCount).toBe(2);
        expect(data.length).toBe(1);
        expect(data[0].name).toBe('Laptop');
    });
  });

  describe('Bulk Operations', () => {
    it('should count items correctly', async () => {
        const count = await offlineDB.countTableItems(TEST_TABLE, { category: 'clothing' });
        expect(count).toBe(2);
    });

    it('should update items by query', async () => {
        const modifiedCount = await offlineDB.updateTableItemsByQuery(TEST_TABLE, { category: 'electronics' }, { on_sale: true });
        expect(modifiedCount).toBe(2);
        const { data } = await offlineDB.queryTable(TEST_TABLE, { on_sale: true });
        expect(data.length).toBe(2);
    });

    it('should delete items by query', async () => {
        const deletedCount = await offlineDB.deleteTableItemsByQuery(TEST_TABLE, { category: 'books' });
        expect(deletedCount).toBe(1);
        const { totalCount } = await offlineDB.queryTable(TEST_TABLE, {});
        expect(totalCount).toBe(4);
    });
  });

  describe('User Operations', () => {
    const testUser = { email: 'test@example.com', password: 'password123' };

    it('should add and retrieve a user', async () => {
      const addedUser = await offlineDB.addUser(testUser);
      expect(addedUser).toHaveProperty('_id');
      
      const foundByEmail = await offlineDB.getUserByEmail(testUser.email);
      expect(foundByEmail.email).toBe(testUser.email);

      const foundById = await offlineDB.getUserById(addedUser._id);
      expect(foundById._id).toBe(addedUser._id);
    });

    it('should update a user', async () => {
      const addedUser = await offlineDB.addUser(testUser);
      const updates = { email: 'updated@example.com' };
      await offlineDB.updateUserById(addedUser._id, updates);

      const updatedUser = await offlineDB.getUserById(addedUser._id);
      expect(updatedUser.email).toBe('updated@example.com');
    });

    it('should delete a user', async () => {
      const addedUser = await offlineDB.addUser(testUser);
      await offlineDB.deleteUserById(addedUser._id);

      const deletedUser = await offlineDB.getUserById(addedUser._id);
      expect(deletedUser).toBeUndefined();
    });
  });
});
