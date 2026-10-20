// ============================================================
// BIT240120_FoodManager - Dish List Screen
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Hiển thị danh sách món ăn với các chức năng:
//   - Hiển thị danh sách dạng card với ảnh thumbnail
//   - Tìm kiếm theo tên
//   - Lọc theo loại, trạng thái, khoảng giá (phối hợp đồng thời)
//   - Sắp xếp theo giá tăng/giảm, thời gian chế biến tăng
//   - Giữ trạng thái bộ lọc khi quay lại từ chi tiết
//   - Hiển thị badge "Quick/Nhanh" hoặc "Regular/Thông thường"
//   - Điều hướng đến chi tiết, thêm mới
//   - Hiển thị trạng thái online/offline
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import { showAlert } from '../utils/alertService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const DishListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    categories,
    isLoading,
    error,
    isOnline,
    isSyncing,
    filters,
    setFilters,
    resetFilters,
    getFilteredDishes,
    refreshDishes,
    refreshCategories,
  } = useData();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh khi screen được focus (giữ bộ lọc)
  useFocusEffect(
    useCallback(() => {
      refreshDishes();
      refreshCategories();
    }, [refreshDishes, refreshCategories])
  );

  // Lấy danh sách đã lọc + sắp xếp
  const filteredDishes = getFilteredDishes();

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDishes(), refreshCategories()]);
    setRefreshing(false);
  };

  /**
   * Lấy ảnh thumbnail của món ăn
   * Ưu tiên ảnh có BIT240120_IsThumbnail = true
   * Nếu không có, lấy ảnh đầu tiên
   */
  const getThumbnail = (dish) => {
    const images = dish.BIT240120_DishImage;
    if (!images || !Array.isArray(images) || images.length === 0) return null;
    const thumbnail = images.find((img) => img.BIT240120_IsThumbnail);
    return thumbnail
      ? thumbnail.BIT240120_ImageUrl
      : images[0].BIT240120_ImageUrl;
  };

  /**
   * Lấy tên loại món từ ID
   */
  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (cat) => cat.BIT240120_Id === categoryId || cat.id === categoryId
    );
    return category ? category.BIT240120_Name : '';
  };

  /**
   * Render một item trong danh sách
   * Hiển thị: thumbnail, tên, giá, loại, trạng thái, badge thời gian
   */
  const renderDishItem = ({ item }) => {
    const thumbnailUrl = getThumbnail(item);
    const isQuick = (item.BIT240120_PreparationTime || 0) <= 15;

    return (
      <TouchableOpacity
        style={styles.dishCard}
        onPress={() =>
          navigation.navigate('DishDetail', {
            dishId: item.BIT240120_Id || item.id,
          })
        }
        activeOpacity={0.7}
      >
        {/* Ảnh thumbnail */}
        <View style={styles.imageContainer}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.dishImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="restaurant-outline" size={32} color={COLORS.textLight} />
            </View>
          )}
          {/* Badge Quick/Regular */}
          <View
            style={[
              styles.timeBadge,
              { backgroundColor: isQuick ? COLORS.quickTag : COLORS.regularTag },
            ]}
          >
            <Ionicons name="time-outline" size={10} color="#FFF" />
            <Text style={styles.timeBadgeText}>
              {isQuick ? t('dish.quick') : t('dish.regular')}
            </Text>
          </View>
        </View>

        {/* Thông tin món ăn */}
        <View style={styles.dishInfo}>
          <Text style={styles.dishName} numberOfLines={1}>
            {item.BIT240120_Name}
          </Text>
          <Text style={styles.dishCategory} numberOfLines={1}>
            {getCategoryName(item.BIT240120_DishCategoryId)}
          </Text>
          <View style={styles.dishMeta}>
            <Text style={styles.dishPrice}>
              ${(item.BIT240120_Price || 0).toFixed(2)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.BIT240120_IsAvailable
                    ? COLORS.successLight
                    : COLORS.errorLight,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.BIT240120_IsAvailable
                      ? COLORS.availableTag
                      : COLORS.unavailableTag,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: item.BIT240120_IsAvailable
                      ? COLORS.availableTag
                      : COLORS.unavailableTag,
                  },
                ]}
              >
                {item.BIT240120_IsAvailable
                  ? t('dish.available')
                  : t('dish.unavailable')}
              </Text>
            </View>
          </View>
          <Text style={styles.prepTime}>
            <Ionicons name="time-outline" size={12} color={COLORS.textLight} />{' '}
            {item.BIT240120_PreparationTime} {t('dish.minutes')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state khi không có kết quả
   */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyText}>{t('dish.noDishes')}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('DishForm')}
      >
        <Text style={styles.addButtonText}>{t('dish.add')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header với trạng thái mạng */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('dish.list')}</Text>
          <Text style={styles.headerSubtitle}>BIT240120 - Trần Gia Khánh</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Network status indicator */}
          <View style={[styles.networkBadge, { backgroundColor: isOnline ? COLORS.successLight : COLORS.errorLight }]}>
            <View style={[styles.networkDot, { backgroundColor: isOnline ? COLORS.online : COLORS.offline }]} />
            <Text style={[styles.networkText, { color: isOnline ? COLORS.online : COLORS.offline }]}>
              {isOnline ? t('common.online') : t('common.offline')}
            </Text>
          </View>
          {isSyncing && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
          )}
        </View>
      </View>

      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('filter.search')}
            placeholderTextColor={COLORS.textLight}
            value={filters.searchText}
            onChangeText={(text) => setFilters({ searchText: text })}
          />
          {filters.searchText.length > 0 && (
            <TouchableOpacity onPress={() => setFilters({ searchText: '' })}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            (filters.categoryId || filters.isAvailable !== null || filters.minPrice || filters.maxPrice || filters.sortBy !== 'none')
              && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options"
            size={22}
            color={
              (filters.categoryId || filters.isAvailable !== null || filters.minPrice || filters.maxPrice || filters.sortBy !== 'none')
                ? COLORS.textOnPrimary
                : COLORS.primary
            }
          />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {t('common.error')}: {error}
          </Text>
          <TouchableOpacity
            onPress={() => Promise.all([refreshDishes(), refreshCategories()])}
          >
            <Text style={styles.errorRetry}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Danh sách món ăn */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDishes}
          keyExtractor={(item, index) =>
            String(item.BIT240120_Id || item.id || index)
          }
          renderItem={renderDishItem}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={[
            styles.listContent,
            filteredDishes.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DishForm')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.textOnPrimary} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        categories={categories}
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        t={t}
      />
    </View>
  );
};

/**
 * FilterModal - Modal lọc và sắp xếp
 * Cho phép phối hợp đồng thời nhiều điều kiện:
 * - Loại món (picker)
 * - Trạng thái (tất cả / đang bán / ngừng bán)
 * - Khoảng giá (min - max)
 * - Sắp xếp (giá tăng/giảm, thời gian tăng)
 */
const FilterModal = ({ visible, onClose, categories, filters, setFilters, resetFilters, t }) => {
  const [localFilters, setLocalFilters] = useState({ ...filters });

  // Sync local filters khi modal mở
  React.useEffect(() => {
    if (visible) {
      setLocalFilters({ ...filters });
    }
  }, [visible]);

  const handleApply = () => {
    const minPrice = localFilters.minPrice.trim();
    const maxPrice = localFilters.maxPrice.trim();
    const hasInvalidPrice =
      (minPrice && (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
      (maxPrice && (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0));

    if (
      hasInvalidPrice ||
      (minPrice && maxPrice && Number(minPrice) > Number(maxPrice))
    ) {
      showAlert(t('common.error'), t('common.invalidPriceRange'));
      return;
    }

    setFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    setLocalFilters({
      searchText: '',
      categoryId: '',
      isAvailable: null,
      minPrice: '',
      maxPrice: '',
      sortBy: 'none',
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('filter.title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Lọc theo loại món */}
            <Text style={styles.filterLabel}>{t('filter.category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              <TouchableOpacity
                style={[styles.chip, !localFilters.categoryId && styles.chipActive]}
                onPress={() => setLocalFilters((f) => ({ ...f, categoryId: '' }))}
              >
                <Text style={[styles.chipText, !localFilters.categoryId && styles.chipTextActive]}>
                  {t('filter.all')}
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.BIT240120_Id || cat.id}
                  style={[
                    styles.chip,
                    localFilters.categoryId === (cat.BIT240120_Id || cat.id) && styles.chipActive,
                  ]}
                  onPress={() =>
                    setLocalFilters((f) => ({
                      ...f,
                      categoryId: cat.BIT240120_Id || cat.id,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilters.categoryId === (cat.BIT240120_Id || cat.id) && styles.chipTextActive,
                    ]}
                  >
                    {cat.BIT240120_Name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Lọc theo trạng thái */}
            <Text style={styles.filterLabel}>{t('filter.status')}</Text>
            <View style={styles.statusFilterRow}>
              {[
                { label: t('filter.allStatus'), value: null },
                { label: t('filter.available'), value: true },
                { label: t('filter.unavailable'), value: false },
              ].map((option) => (
                <TouchableOpacity
                  key={String(option.value)}
                  style={[
                    styles.chip,
                    localFilters.isAvailable === option.value && styles.chipActive,
                  ]}
                  onPress={() =>
                    setLocalFilters((f) => ({ ...f, isAvailable: option.value }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilters.isAvailable === option.value && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lọc theo khoảng giá */}
            <Text style={styles.filterLabel}>{t('filter.priceRange')}</Text>
            <View style={styles.priceRangeRow}>
              <TextInput
                style={styles.priceInput}
                placeholder={t('filter.minPrice')}
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                value={localFilters.minPrice}
                onChangeText={(text) =>
                  setLocalFilters((f) => ({ ...f, minPrice: text }))
                }
              />
              <Text style={styles.priceSeparator}>—</Text>
              <TextInput
                style={styles.priceInput}
                placeholder={t('filter.maxPrice')}
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                value={localFilters.maxPrice}
                onChangeText={(text) =>
                  setLocalFilters((f) => ({ ...f, maxPrice: text }))
                }
              />
            </View>

            {/* Sắp xếp */}
            <Text style={styles.filterLabel}>{t('filter.sortBy')}</Text>
            {[
              { label: t('filter.none'), value: 'none' },
              { label: t('filter.priceAsc'), value: 'priceAsc' },
              { label: t('filter.priceDesc'), value: 'priceDesc' },
              { label: t('filter.prepTimeAsc'), value: 'prepTimeAsc' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  localFilters.sortBy === option.value && styles.sortOptionActive,
                ]}
                onPress={() =>
                  setLocalFilters((f) => ({ ...f, sortBy: option.value }))
                }
              >
                <Ionicons
                  name={
                    localFilters.sortBy === option.value
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={20}
                  color={
                    localFilters.sortBy === option.value
                      ? COLORS.primary
                      : COLORS.textLight
                  }
                />
                <Text
                  style={[
                    styles.sortOptionText,
                    localFilters.sortBy === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Nút áp dụng / reset */}
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>{t('filter.reset')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>{t('filter.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ========================
// STYLES
// ========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorBanner: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.errorLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  errorBannerText: {
    flex: 1,
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  errorRetry: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  networkText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  imageContainer: {
    width: 110,
    height: 120,
    position: 'relative',
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  timeBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#FFF',
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  dishInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  dishName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  dishCategory: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dishMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dishPrice: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  prepTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  chipTextActive: {
    color: COLORS.textOnPrimary,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  priceRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  priceSeparator: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  sortOptionActive: {},
  sortOptionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  resetButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textOnPrimary,
  },
});

export default DishListScreen;
