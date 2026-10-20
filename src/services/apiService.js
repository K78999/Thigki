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

const parseResponse = async (response) => {
  if (response.status === 204) return null;

  const body = await response.text();
  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('MockAPI returned an invalid JSON response');
  }
};

const normalizeRecord = (record) => {
  if (record === null || record === undefined) return record;
  if (typeof record !== 'object') {
    throw new Error('MockAPI returned an invalid record');
  }

  const recordId = record.BIT240120_Id || record.id;
  if (!recordId) {
    throw new Error('MockAPI record is missing its ID');
  }

  const fields = { ...record };
  delete fields.id;
  return {
    ...fields,
    BIT240120_Id: recordId,
  };
};

const normalizeList = (records) => {
  if (!Array.isArray(records)) {
    throw new Error('MockAPI returned an invalid list response');
  }
  return records.map(normalizeRecord);
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
  return normalizeList(await parseResponse(response));
};

/**
 * Lấy một loại món ăn theo ID
 * GET /BIT240120_DishCategory/:id
 * @param {string} id - BIT240120_Id của category
 */
export const fetchCategoryById = async (id) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.CATEGORIES}/${encodeURIComponent(id)}`
  );
  return normalizeRecord(await parseResponse(response));
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
  return normalizeRecord(await parseResponse(response));
};

/**
 * Cập nhật loại món ăn
 * PUT /BIT240120_DishCategory/:id
 * @param {string} id - BIT240120_Id
 * @param {object} category - Dữ liệu cập nhật
 */
export const updateCategory = async (id, category) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.CATEGORIES}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    }
  );
  return normalizeRecord(await parseResponse(response));
};

/**
 * Xóa loại món ăn
 * DELETE /BIT240120_DishCategory/:id
 * @param {string} id - BIT240120_Id
 */
export const deleteCategory = async (id) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.CATEGORIES}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
  return parseResponse(response);
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
  return normalizeList(await parseResponse(response));
};

/**
 * Lấy một món ăn theo ID
 * GET /BIT240120_Dish/:id
 * @param {string} id - BIT240120_Id của dish
 */
export const fetchDishById = async (id) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.DISHES}/${encodeURIComponent(id)}`
  );
  return normalizeRecord(await parseResponse(response));
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
  return normalizeRecord(await parseResponse(response));
};

/**
 * Cập nhật món ăn
 * PUT /BIT240120_Dish/:id
 * @param {string} id - BIT240120_Id
 * @param {object} dish - Dữ liệu cập nhật
 */
export const updateDish = async (id, dish) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.DISHES}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dish),
    }
  );
  return normalizeRecord(await parseResponse(response));
};

/**
 * Xóa món ăn
 * DELETE /BIT240120_Dish/:id
 * @param {string} id - BIT240120_Id
 */
export const deleteDish = async (id) => {
  const response = await fetchWithTimeout(
    `${MOCKAPI_BASE_URL}${ENDPOINTS.DISHES}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
  return parseResponse(response);
};
