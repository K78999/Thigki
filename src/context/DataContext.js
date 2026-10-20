// ============================================================
// BIT240120_FoodManager - Data Context (React Context API)
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Quản lý state toàn cục cho ứng dụng
// Sử dụng React Context + useReducer pattern
// Cung cấp:
//   - State: categories, dishes, filters, network status, language
//   - Actions: CRUD operations, filter/sort, sync, language change
// Tất cả tên trường dữ liệu có tiền tố BIT240120_
// ============================================================

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as api from '../services/apiService';
import * as storage from '../services/storageService';
import { syncData, loadDataWithFallback, checkNetworkStatus } from '../services/syncService';

// ========================
// INITIAL STATE
// ========================
const initialState = {
  categories: [],           // Mảng BIT240120_DishCategory
  dishes: [],               // Mảng BIT240120_Dish
  isLoading: false,         // Đang tải dữ liệu
  isOnline: true,           // Trạng thái mạng
  isSyncing: false,         // Đang đồng bộ
  lastSyncTime: null,       // Thời gian sync cuối
  error: null,              // Lỗi hiện tại
  filters: {                // Bộ lọc và sắp xếp
    searchText: '',         // Tìm theo tên
    categoryId: '',         // Lọc theo loại món
    isAvailable: null,      // Lọc theo trạng thái (null = tất cả)
    minPrice: '',           // Giá tối thiểu
    maxPrice: '',           // Giá tối đa
    sortBy: 'none',         // Sắp xếp: none | priceAsc | priceDesc | prepTimeAsc
  },
};

// ========================
// ACTION TYPES
// ========================
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_DISHES: 'SET_DISHES',
  SET_ONLINE: 'SET_ONLINE',
  SET_SYNCING: 'SET_SYNCING',
  SET_LAST_SYNC: 'SET_LAST_SYNC',
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
};

// ========================
// REDUCER
// Xử lý state changes dựa trên action type
// ========================
const dataReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    case ActionTypes.SET_CATEGORIES:
      return { ...state, categories: action.payload, isLoading: false };
    case ActionTypes.SET_DISHES:
      return { ...state, dishes: action.payload, isLoading: false };
    case ActionTypes.SET_ONLINE:
      return { ...state, isOnline: action.payload };
    case ActionTypes.SET_SYNCING:
      return { ...state, isSyncing: action.payload };
    case ActionTypes.SET_LAST_SYNC:
      return { ...state, lastSyncTime: action.payload };
    case ActionTypes.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case ActionTypes.RESET_FILTERS:
      return { ...state, filters: initialState.filters };
    default:
      return state;
  }
};

// ========================
// CONTEXT
// ========================
const DataContext = createContext(null);
const createLocalId = () =>
  `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * DataProvider - Component bọc toàn bộ app
 * Cung cấp state và actions cho các component con
 */
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const syncInProgressRef = useRef(false);

  // ========================
  // NETWORK MONITORING
  // Theo dõi trạng thái mạng liên tục
  // Khi có mạng trở lại → tự động đồng bộ
  // ========================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (netState) => {
      const wasOffline = !state.isOnline;
      const isNowOnline =
        netState.isConnected === true && netState.isInternetReachable !== false;

      dispatch({ type: ActionTypes.SET_ONLINE, payload: isNowOnline });

      // Tự động sync khi chuyển từ offline → online
      if (wasOffline && isNowOnline && !syncInProgressRef.current) {
        await performSync();
      }
    });

    return () => unsubscribe();
  }, [state.isOnline]);

  // ========================
  // INITIAL DATA LOAD
  // Load dữ liệu khi app khởi động
  // ========================
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Load dữ liệu ban đầu
   * - Thử lấy từ API (nếu online)
   * - Fallback về local storage (nếu offline)
   */
  const loadInitialData = async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const [categories, dishes] = await Promise.all([
        loadDataWithFallback('CATEGORY'),
        loadDataWithFallback('DISH'),
      ]);
      dispatch({ type: ActionTypes.SET_CATEGORIES, payload: categories });
      dispatch({ type: ActionTypes.SET_DISHES, payload: dishes });

      const lastSync = await storage.getLastSyncTime();
      dispatch({ type: ActionTypes.SET_LAST_SYNC, payload: lastSync });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  /**
   * Thực hiện đồng bộ dữ liệu
   * Sử dụng ref để tránh sync trùng lặp
   */
  const performSync = useCallback(async () => {
    if (syncInProgressRef.current) {
      return { success: false, message: 'A sync is already in progress' };
    }
    syncInProgressRef.current = true;
    dispatch({ type: ActionTypes.SET_SYNCING, payload: true });

    try {
      const result = await syncData();
      if (result.success) {
        // Reload dữ liệu sau sync
        const [categories, dishes] = await Promise.all([
          storage.loadCategories(),
          storage.loadDishes(),
        ]);
        dispatch({ type: ActionTypes.SET_CATEGORIES, payload: categories });
        dispatch({ type: ActionTypes.SET_DISHES, payload: dishes });
        dispatch({ type: ActionTypes.SET_LAST_SYNC, payload: Date.now() });
      }
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, message: error.message };
    } finally {
      dispatch({ type: ActionTypes.SET_SYNCING, payload: false });
      syncInProgressRef.current = false;
    }
  }, []);

  // ========================
  // CATEGORY ACTIONS
  // ========================

  /**
   * Refresh danh sách categories
   */
  const refreshCategories = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    dispatch({ type: ActionTypes.CLEAR_ERROR });
    try {
      const categories = await loadDataWithFallback('CATEGORY');
      dispatch({ type: ActionTypes.SET_CATEGORIES, payload: categories });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  /**
   * Thêm loại món ăn mới
   * Online: gọi API → lưu local
   * Offline: tạo localId tạm → lưu local + pending op
   */
  const addCategory = useCallback(async (categoryData) => {
    const isOnline = await checkNetworkStatus();

    if (isOnline) {
      try {
        const result = await api.createCategory(categoryData);
        const categories = await loadDataWithFallback('CATEGORY');
        const categoryId = result && (result.BIT240120_Id || result.id);
        const updatedCategories =
          categoryId &&
          !categories.some(
            (category) =>
              (category.BIT240120_Id || category.id) === categoryId
          )
            ? [...categories, result]
            : categories;
        await storage.saveCategories(updatedCategories);
        dispatch({
          type: ActionTypes.SET_CATEGORIES,
          payload: updatedCategories,
        });
        return result;
      } catch (error) {
        throw error;
      }
    } else {
      // Offline: tạo ID tạm
      const localId = createLocalId();
      const newCategory = { ...categoryData, BIT240120_Id: localId };

      const categories = await storage.loadCategories();
      categories.push(newCategory);
      await storage.saveCategories(categories);

      // Lưu pending operation
      await storage.addPendingOperation({
        type: 'CREATE',
        entity: 'CATEGORY',
        data: categoryData,
        localId: localId,
      });

      dispatch({ type: ActionTypes.SET_CATEGORIES, payload: categories });
      return newCategory;
    }
  }, []);

  /**
   * Cập nhật loại món ăn
   */
  const editCategory = useCallback(async (id, categoryData) => {
    const isOnline = await checkNetworkStatus();

    if (isOnline) {
      try {
        const result = await api.updateCategory(id, categoryData);
        const categories = await loadDataWithFallback('CATEGORY');
        dispatch({ type: ActionTypes.SET_CATEGORIES, payload: categories });
        return result;
      } catch (error) {
        throw error;
      }
    } else {
      const categories = await storage.loadCategories();
      const updated = categories.map((cat) =>
        (cat.BIT240120_Id === id || cat.id === id)
          ? { ...cat, ...categoryData }
          : cat
      );
      await storage.saveCategories(updated);

      await storage.addPendingOperation({
        type: 'UPDATE',
        entity: 'CATEGORY',
        data: { ...categoryData, BIT240120_Id: id },
      });

      dispatch({ type: ActionTypes.SET_CATEGORIES, payload: updated });
    }
  }, []);

  /**
   * Xóa loại món ăn
   * Ràng buộc: không cho xóa nếu có món ăn đang thuộc loại này
   */
  const removeCategory = useCallback(async (id) => {
    // Kiểm tra ràng buộc: có món nào thuộc category này không?
    const dishes = state.dishes;
    const hasRelatedDishes = dishes.some(
      (dish) => dish.BIT240120_DishCategoryId === id
    );

    if (hasRelatedDishes) {
      throw new Error('CATEGORY_IN_USE');
    }

    const isOnline = await checkNetworkStatus();

    if (isOnline) {
      try {
        await api.deleteCategory(id);
        const categories = await loadDataWithFallback('CATEGORY');
        dispatch({ type: ActionTypes.SET_CATEGORIES, payload: categories });
      } catch (error) {
        throw error;
      }
    } else {
      const categories = await storage.loadCategories();
      const filtered = categories.filter(
        (cat) => cat.BIT240120_Id !== id && cat.id !== id
      );
      await storage.saveCategories(filtered);

      await storage.addPendingOperation({
        type: 'DELETE',
        entity: 'CATEGORY',
        data: { BIT240120_Id: id },
      });

      dispatch({ type: ActionTypes.SET_CATEGORIES, payload: filtered });
    }
  }, [state.dishes]);

  // ========================
  // DISH ACTIONS
  // ========================

  /**
   * Refresh danh sách dishes
   */
  const refreshDishes = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    dispatch({ type: ActionTypes.CLEAR_ERROR });
    try {
      const dishes = await loadDataWithFallback('DISH');
      dispatch({ type: ActionTypes.SET_DISHES, payload: dishes });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  /**
   * Thêm món ăn mới
   * Tương tự addCategory, hỗ trợ offline
   */
  const addDish = useCallback(async (dishData) => {
    const isOnline = await checkNetworkStatus();

    if (isOnline) {
      try {
        const result = await api.createDish(dishData);
        const dishes = await loadDataWithFallback('DISH');
        const dishId = result && (result.BIT240120_Id || result.id);
        const updatedDishes =
          dishId &&
          !dishes.some((dish) => (dish.BIT240120_Id || dish.id) === dishId)
            ? [...dishes, result]
            : dishes;
        await storage.saveDishes(updatedDishes);
        dispatch({ type: ActionTypes.SET_DISHES, payload: updatedDishes });
        return result;
      } catch (error) {
        throw error;
      }
    } else {
      const localId = createLocalId();
      const newDish = { ...dishData, BIT240120_Id: localId };

      const dishes = await storage.loadDishes();
      dishes.push(newDish);
      await storage.saveDishes(dishes);

      await storage.addPendingOperation({
        type: 'CREATE',
        entity: 'DISH',
        data: dishData,
        localId: localId,
      });

      dispatch({ type: ActionTypes.SET_DISHES, payload: dishes });
      return newDish;
    }
  }, []);

  /**
   * Cập nhật món ăn
   */
  const editDish = useCallback(async (id, dishData) => {
    const isOnline = await checkNetworkStatus();

    if (isOnline) {
      try {
        const result = await api.updateDish(id, dishData);
        const dishes = await loadDataWithFallback('DISH');
        dispatch({ type: ActionTypes.SET_DISHES, payload: dishes });
        return result;
      } catch (error) {
        throw error;
      }
    } else {
      const dishes = await storage.loadDishes();
      const updated = dishes.map((dish) =>
        (dish.BIT240120_Id === id || dish.id === id)
          ? { ...dish, ...dishData }
          : dish
      );
      await storage.saveDishes(updated);

      await storage.addPendingOperation({
        type: 'UPDATE',
        entity: 'DISH',
        data: { ...dishData, BIT240120_Id: id },
      });

      dispatch({ type: ActionTypes.SET_DISHES, payload: updated });
    }
  }, []);

  /**
   * Xóa món ăn
   */
  const removeDish = useCallback(async (id) => {
    const isOnline = await checkNetworkStatus();

    if (isOnline) {
      try {
        await api.deleteDish(id);
        const dishes = await loadDataWithFallback('DISH');
        dispatch({ type: ActionTypes.SET_DISHES, payload: dishes });
      } catch (error) {
        throw error;
      }
    } else {
      const dishes = await storage.loadDishes();
      const filtered = dishes.filter(
        (dish) => dish.BIT240120_Id !== id && dish.id !== id
      );
      await storage.saveDishes(filtered);

      await storage.addPendingOperation({
        type: 'DELETE',
        entity: 'DISH',
        data: { BIT240120_Id: id },
      });

      dispatch({ type: ActionTypes.SET_DISHES, payload: filtered });
    }
  }, []);

  // ========================
  // FILTER ACTIONS
  // ========================

  const setFilters = useCallback((filterUpdates) => {
    dispatch({ type: ActionTypes.SET_FILTERS, payload: filterUpdates });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_FILTERS });
  }, []);

  /**
   * Lấy danh sách món ăn đã lọc và sắp xếp
   * Áp dụng tất cả bộ lọc đồng thời:
   *   1. Tìm theo tên (searchText)
   *   2. Lọc theo loại (categoryId)
   *   3. Lọc theo trạng thái (isAvailable)
   *   4. Lọc theo khoảng giá (minPrice, maxPrice)
   *   5. Sắp xếp (sortBy)
   */
  const getFilteredDishes = useCallback(() => {
    let result = [...state.dishes];

    const { searchText, categoryId, isAvailable, minPrice, maxPrice, sortBy } =
      state.filters;

    // 1. Tìm theo tên (không phân biệt hoa thường)
    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      result = result.filter((dish) =>
        (dish.BIT240120_Name || '').toLowerCase().includes(search)
      );
    }

    // 2. Lọc theo loại món
    if (categoryId) {
      result = result.filter(
        (dish) => dish.BIT240120_DishCategoryId === categoryId
      );
    }

    // 3. Lọc theo trạng thái
    if (isAvailable !== null && isAvailable !== undefined) {
      result = result.filter(
        (dish) => dish.BIT240120_IsAvailable === isAvailable
      );
    }

    // 4. Lọc theo khoảng giá
    if (minPrice !== '' && !isNaN(Number(minPrice))) {
      result = result.filter(
        (dish) => dish.BIT240120_Price >= Number(minPrice)
      );
    }
    if (maxPrice !== '' && !isNaN(Number(maxPrice))) {
      result = result.filter(
        (dish) => dish.BIT240120_Price <= Number(maxPrice)
      );
    }

    // 5. Sắp xếp
    switch (sortBy) {
      case 'priceAsc':
        result.sort((a, b) => (a.BIT240120_Price || 0) - (b.BIT240120_Price || 0));
        break;
      case 'priceDesc':
        result.sort((a, b) => (b.BIT240120_Price || 0) - (a.BIT240120_Price || 0));
        break;
      case 'prepTimeAsc':
        result.sort(
          (a, b) =>
            (a.BIT240120_PreparationTime || 0) - (b.BIT240120_PreparationTime || 0)
        );
        break;
      default:
        break;
    }

    return result;
  }, [state.dishes, state.filters]);

  // ========================
  // CONTEXT VALUE
  // ========================
  const contextValue = {
    // State
    ...state,
    // Computed
    getFilteredDishes,
    // Category actions
    refreshCategories,
    addCategory,
    editCategory,
    removeCategory,
    // Dish actions
    refreshDishes,
    addDish,
    editDish,
    removeDish,
    // Filter actions
    setFilters,
    resetFilters,
    // Sync
    performSync,
    // Dispatch (for custom actions)
    dispatch,
    ActionTypes,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * Custom hook để sử dụng DataContext
 * Giải thích: Thay vì dùng useContext(DataContext) trực tiếp,
 * hook này kiểm tra context có tồn tại không
 */
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
