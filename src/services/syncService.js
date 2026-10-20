// ============================================================
// BIT240120_FoodManager - Sync Service
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Đồng bộ dữ liệu giữa AsyncStorage (local) và MockAPI (server)
// Chiến lược sync:
//   1. Khi online: đọc từ API, lưu vào local
//   2. Khi offline: đọc/ghi vào local, lưu pending operations
//   3. Khi có mạng trở lại: replay pending ops lên API, merge dữ liệu
// Tránh trùng lặp bằng cách so sánh ID và dùng localId mapping
// ============================================================

import NetInfo from '@react-native-community/netinfo';
import * as api from './apiService';
import * as storage from './storageService';

/**
 * Kiểm tra kết nối mạng
 * @returns {boolean} - true nếu có Internet
 */
export const checkNetworkStatus = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch (error) {
    console.error('Unable to determine network status:', error);
    return false;
  }
};

/**
 * Đồng bộ dữ liệu - hàm chính
 * Quy trình:
 *   1. Kiểm tra có pending operations không
 *   2. Replay từng operation lên API (theo thứ tự timestamp)
 *   3. Fetch dữ liệu mới nhất từ API
 *   4. Lưu vào local storage
 *   5. Cập nhật lastSyncTime
 * @returns {object} - { success: boolean, message: string }
 */
export const syncData = async () => {
  const isOnline = await checkNetworkStatus();
  if (!isOnline) {
    return { success: false, message: 'No internet connection' };
  }

  try {
    // Keep the local snapshot intact if any queued operation cannot be replayed.
    await replayPendingOperations();

    // Bước 2: Fetch dữ liệu mới nhất từ API
    const [categories, dishes] = await Promise.all([
      api.fetchCategories(),
      api.fetchDishes(),
    ]);

    // Bước 3: Lưu vào local storage
    await storage.saveCategories(categories);
    await storage.saveDishes(dishes);

    // Bước 4: Cập nhật thời gian đồng bộ
    await storage.saveLastSyncTime();

    return { success: true, message: 'Data synced successfully' };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Replay các thao tác chờ đồng bộ lên API
 * Xử lý từng operation theo thứ tự thời gian (FIFO)
 * Sau khi replay thành công, xóa operation khỏi hàng đợi
 * Đối với CREATE: cập nhật localId → serverId trong dữ liệu local
 */
const replayPendingOperations = async () => {
  const pendingOps = await storage.getPendingOperations();
  if (pendingOps.length === 0) return;

  // Sắp xếp theo timestamp để đảm bảo thứ tự
  pendingOps.sort((a, b) => a.timestamp - b.timestamp);

  // Map localId → serverId để xử lý tham chiếu
  const idMapping = {};

  for (const op of pendingOps) {
    try {
      await executeOperation(op, idMapping);
      await storage.removePendingOperation(op.id);
    } catch (error) {
      if (op.type === 'DELETE' && error.message.includes('404')) {
        await storage.removePendingOperation(op.id);
        continue;
      }
      throw new Error(`Could not sync queued operation ${op.id}: ${error.message}`);
    }
  }
};

/**
 * Thực thi một pending operation lên API
 * @param {object} op - Operation cần thực thi
 * @param {object} idMapping - Map localId → serverId
 */
const executeOperation = async (op, idMapping) => {
  const { type, entity, data, localId } = op;

  switch (type) {
    case 'CREATE': {
      // Tạo mới trên server
      const createFn = entity === 'CATEGORY' ? api.createCategory : api.createDish;
      const fetchFn = entity === 'CATEGORY' ? api.fetchCategories : api.fetchDishes;

      // Chuẩn bị dữ liệu - loại bỏ localId, thay thế các reference ID
      const createData = { ...data };
      delete createData.BIT240120_Id; // Server sẽ tự sinh ID
      createData.BIT240120_SyncKey = op.id;

      // Nếu dish có categoryId là localId, thay bằng serverId
      if (entity === 'DISH' && createData.BIT240120_DishCategoryId) {
        const mappedCatId = idMapping[createData.BIT240120_DishCategoryId];
        if (mappedCatId) {
          createData.BIT240120_DishCategoryId = mappedCatId;
        }
      }

      const existingRecords = await fetchFn();
      const existingRecord = existingRecords.find(
        (record) => record.BIT240120_SyncKey === op.id
      );
      const result = existingRecord || await createFn(createData);
      const serverId = result && (result.id || result.BIT240120_Id);
      if (!serverId) {
        throw new Error('MockAPI create response did not include an ID');
      }

      // Lưu mapping localId → serverId
      if (localId) {
        idMapping[localId] = serverId;
      }

      // Cập nhật ID trong local storage
      await updateLocalId(entity, localId, serverId);
      break;
    }

    case 'UPDATE': {
      const updateFn = entity === 'CATEGORY' ? api.updateCategory : api.updateDish;
      const id = data.BIT240120_Id || data.id;

      // Nếu ID là localId, tìm serverId từ mapping
      const serverId = idMapping[id] || id;

      const updateData = { ...data };
      if (entity === 'DISH' && updateData.BIT240120_DishCategoryId) {
        const mappedCatId = idMapping[updateData.BIT240120_DishCategoryId];
        if (mappedCatId) {
          updateData.BIT240120_DishCategoryId = mappedCatId;
        }
      }

      await updateFn(serverId, updateData);
      break;
    }

    case 'DELETE': {
      const deleteFn = entity === 'CATEGORY' ? api.deleteCategory : api.deleteDish;
      const id = data.BIT240120_Id || data.id;
      const serverId = idMapping[id] || id;

      await deleteFn(serverId);
      break;
    }
  }
};

/**
 * Cập nhật localId thành serverId trong local storage
 * Giải thích: Khi tạo offline, item có localId tạm
 * Sau khi sync thành công, cần thay localId bằng ID từ server
 * để tránh trùng lặp
 */
const updateLocalId = async (entity, localId, serverId) => {
  if (!localId || !serverId) return;

  if (entity === 'CATEGORY') {
    const categories = await storage.loadCategories();
    const updated = categories.map((cat) => {
      if (cat.BIT240120_Id === localId) {
        return { ...cat, BIT240120_Id: serverId };
      }
      return cat;
    });
    await storage.saveCategories(updated);

    // Cập nhật DishCategoryId trong các dish
    const dishes = await storage.loadDishes();
    const updatedDishes = dishes.map((dish) => {
      if (dish.BIT240120_DishCategoryId === localId) {
        return { ...dish, BIT240120_DishCategoryId: serverId };
      }
      return dish;
    });
    await storage.saveDishes(updatedDishes);
  } else {
    const dishes = await storage.loadDishes();
    const updated = dishes.map((dish) => {
      if (dish.BIT240120_Id === localId) {
        return { ...dish, BIT240120_Id: serverId };
      }
      return dish;
    });
    await storage.saveDishes(updated);
  }

  const pendingOperations = await storage.getPendingOperations();
  const updatedOperations = pendingOperations.map((operation) => {
    const data = { ...operation.data };
    if (data.BIT240120_Id === localId) {
      data.BIT240120_Id = serverId;
    }
    if (
      entity === 'CATEGORY' &&
      data.BIT240120_DishCategoryId === localId
    ) {
      data.BIT240120_DishCategoryId = serverId;
    }
    return { ...operation, data };
  });
  await storage.saveData(storage.STORAGE_KEYS.PENDING_OPS, updatedOperations);
};

/**
 * Load dữ liệu - ưu tiên API nếu online, fallback local nếu offline
 * @param {string} entity - 'CATEGORY' hoặc 'DISH'
 * @returns {Array} - Danh sách items
 */
export const loadDataWithFallback = async (entity) => {
  const isOnline = await checkNetworkStatus();

  if (isOnline) {
    try {
      const pendingOperations = await storage.getPendingOperations();
      if (pendingOperations.length > 0) {
        return entity === 'CATEGORY'
          ? await storage.loadCategories()
          : await storage.loadDishes();
      }

      let data;
      if (entity === 'CATEGORY') {
        data = await api.fetchCategories();
        await storage.saveCategories(data);
      } else {
        data = await api.fetchDishes();
        await storage.saveDishes(data);
      }
      return data;
    } catch (error) {
      console.warn('API failed, falling back to local:', error);
    }
  }

  // Fallback to local storage
  if (entity === 'CATEGORY') {
    return await storage.loadCategories();
  }
  return await storage.loadDishes();
};
