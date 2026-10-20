// ============================================================
// BIT240120_FoodManager - Storage Service (AsyncStorage)
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Quản lý lưu trữ dữ liệu offline bằng AsyncStorage
// AsyncStorage là key-value store, không phải CSDL quan hệ
// => Tổ chức dữ liệu bằng JSON, tự quản lý quan hệ logic
// Hỗ trợ: lưu/đọc/xóa dữ liệu, pending operations cho sync
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ========================
// Storage Keys - có tiền tố MSSV
// ========================
const STORAGE_KEYS = {
  CATEGORIES: 'BIT240120_DishCategory_Data',     // Lưu danh sách loại món
  DISHES: 'BIT240120_Dish_Data',                  // Lưu danh sách món ăn
  PENDING_OPS: 'BIT240120_PendingOperations',     // Lưu các thao tác chờ đồng bộ
  LAST_SYNC: 'BIT240120_LastSyncTime',            // Thời gian đồng bộ cuối
};

// ========================
// GENERIC STORAGE OPERATIONS
// ========================

/**
 * Lưu dữ liệu vào AsyncStorage
 * @param {string} key - Storage key
 * @param {any} data - Dữ liệu cần lưu (sẽ được JSON.stringify)
 * Giải thích: AsyncStorage chỉ lưu string, nên phải serialize object/array
 */
export const saveData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    throw error;
  }
};

/**
 * Đọc dữ liệu từ AsyncStorage
 * @param {string} key - Storage key
 * @returns {any} - Dữ liệu đã parse từ JSON, hoặc null nếu không có
 */
export const loadData = async (key) => {
  try {
    const jsonData = await AsyncStorage.getItem(key);
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return null;
  }
};

/**
 * Xóa dữ liệu khỏi AsyncStorage
 * @param {string} key - Storage key
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
  }
};

// ========================
// CATEGORY STORAGE
// Bảng: BIT240120_DishCategory
// ========================

/**
 * Lưu danh sách loại món ăn vào local
 * @param {Array} categories - Mảng các BIT240120_DishCategory
 */
export const saveCategories = async (categories) => {
  await saveData(STORAGE_KEYS.CATEGORIES, categories);
};

/**
 * Đọc danh sách loại món ăn từ local
 * @returns {Array} - Mảng các BIT240120_DishCategory, hoặc mảng rỗng
 */
export const loadCategories = async () => {
  const data = await loadData(STORAGE_KEYS.CATEGORIES);
  return data || [];
};

// ========================
// DISH STORAGE
// Bảng: BIT240120_Dish
// ========================

/**
 * Lưu danh sách món ăn vào local
 * @param {Array} dishes - Mảng các BIT240120_Dish
 */
export const saveDishes = async (dishes) => {
  await saveData(STORAGE_KEYS.DISHES, dishes);
};

/**
 * Đọc danh sách món ăn từ local
 * @returns {Array} - Mảng các BIT240120_Dish, hoặc mảng rỗng
 */
export const loadDishes = async () => {
  const data = await loadData(STORAGE_KEYS.DISHES);
  return data || [];
};

// ========================
// PENDING OPERATIONS (cho offline sync)
// ========================

/**
 * Cấu trúc pending operation:
 * {
 *   id: string (unique),
 *   type: 'CREATE' | 'UPDATE' | 'DELETE',
 *   entity: 'CATEGORY' | 'DISH',
 *   data: object,                    // Dữ liệu cần đồng bộ
 *   localId: string,                 // ID tạm thời (cho CREATE)
 *   timestamp: number                // Thời gian tạo operation
 * }
 */

/**
 * Lấy danh sách các thao tác chờ đồng bộ
 * @returns {Array} - Mảng pending operations
 */
export const getPendingOperations = async () => {
  const data = await loadData(STORAGE_KEYS.PENDING_OPS);
  return data || [];
};

/**
 * Thêm một thao tác chờ đồng bộ
 * Giải thích: Khi offline, mọi thao tác CRUD được lưu vào hàng đợi
 * Khi online trở lại, các thao tác này sẽ được replay lên MockAPI
 * @param {object} operation - Thao tác cần thêm
 */
export const addPendingOperation = async (operation) => {
  const ops = await getPendingOperations();
  ops.push({
    ...operation,
    id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  });
  await saveData(STORAGE_KEYS.PENDING_OPS, ops);
};

/**
 * Xóa một thao tác đã đồng bộ thành công
 * @param {string} operationId - ID của operation cần xóa
 */
export const removePendingOperation = async (operationId) => {
  const ops = await getPendingOperations();
  const filtered = ops.filter((op) => op.id !== operationId);
  await saveData(STORAGE_KEYS.PENDING_OPS, filtered);
};

/**
 * Xóa tất cả pending operations (sau khi sync thành công)
 */
export const clearPendingOperations = async () => {
  await removeData(STORAGE_KEYS.PENDING_OPS);
};

// ========================
// SYNC TIMESTAMP
// ========================

/**
 * Lưu thời gian đồng bộ cuối cùng
 */
export const saveLastSyncTime = async () => {
  await saveData(STORAGE_KEYS.LAST_SYNC, Date.now());
};

/**
 * Đọc thời gian đồng bộ cuối cùng
 * @returns {number|null} - Timestamp hoặc null
 */
export const getLastSyncTime = async () => {
  return await loadData(STORAGE_KEYS.LAST_SYNC);
};

export { STORAGE_KEYS };
