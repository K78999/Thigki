// ============================================================
// BIT240120_FoodManager - API Service Layer
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Cung cấp các hàm gọi API (CRUD) cho MockAPI
// Xử lý: timeout, error handling, response parsing
// Tất cả endpoints sử dụng tên bảng có tiền tố BIT240120_
// ============================================================

import { MOCKAPI_BASE_URL, ENDPOINTS, API_TIMEOUT } from '../config/api';

/**
 * Hàm helper tạo fetch request có timeout
 * @param {string} url - URL cần gọi
 * @param {object} options - Fetch options (method, headers, body...)
 * @returns {Promise} - Response từ API
 * Giải thích: Sử dụng AbortController để hủy request nếu quá timeout
 */
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your internet connection');
    }
    throw error;
  }
};

// ========================
// DISH CATEGORY API
// Bảng: BIT240120_DishCategory
// ========================

/**
 * Lấy tất cả loại món ăn từ MockAPI
 * GET /BIT240120_DishCategory
 */
export const fetchCategories = async () => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.CATEGORIES}`
  );
  return response.json();
};

/**
 * Lấy một loại món ăn theo ID
 * GET /BIT240120_DishCategory/:id
 * @param {string} id - BIT240120_Id của category
 */
export const fetchCategoryById = async (id) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.CATEGORIES}/${id}`
  );
  return response.json();
};

/**
 * Tạo loại món ăn mới
 * POST /BIT240120_DishCategory
 * @param {object} category - Dữ liệu category (BIT240120_Name, BIT240120_Description)
 */
export const createCategory = async (category) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.CATEGORIES}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    }
  );
  return response.json();
};

/**
 * Cập nhật loại món ăn
 * PUT /BIT240120_DishCategory/:id
 * @param {string} id - BIT240120_Id
 * @param {object} category - Dữ liệu cập nhật
 */
export const updateCategory = async (id, category) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.CATEGORIES}/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    }
  );
  return response.json();
};

/**
 * Xóa loại món ăn
 * DELETE /BIT240120_DishCategory/:id
 * @param {string} id - BIT240120_Id
 */
export const deleteCategory = async (id) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.CATEGORIES}/${id}`,
    {
      method: 'DELETE',
    }
  );
  return response.json();
};

// ========================
// DISH API
// Bảng: BIT240120_Dish
// ========================

/**
 * Lấy tất cả món ăn từ MockAPI
 * GET /BIT240120_Dish
 */
export const fetchDishes = async () => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.DISHES}`
  );
  return response.json();
};

/**
 * Lấy một món ăn theo ID
 * GET /BIT240120_Dish/:id
 * @param {string} id - BIT240120_Id của dish
 */
export const fetchDishById = async (id) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.DISHES}/${id}`
  );
  return response.json();
};

/**
 * Tạo món ăn mới
 * POST /BIT240120_Dish
 * @param {object} dish - Dữ liệu dish đầy đủ các trường BIT240120_*
 */
export const createDish = async (dish) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.DISHES}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dish),
    }
  );
  return response.json();
};

/**
 * Cập nhật món ăn
 * PUT /BIT240120_Dish/:id
 * @param {string} id - BIT240120_Id
 * @param {object} dish - Dữ liệu cập nhật
 */
export const updateDish = async (id, dish) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.DISHES}/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dish),
    }
  );
  return response.json();
};

/**
 * Xóa món ăn
 * DELETE /BIT240120_Dish/:id
 * @param {string} id - BIT240120_Id
 */
export const deleteDish = async (id) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.DISHES}/${id}`,
    {
      method: 'DELETE',
    }
  );
  return response.json();
};
