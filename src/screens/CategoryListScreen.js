// ============================================================
// BIT240120_FoodManager - Category List Screen
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Quản lý danh sách loại món ăn (BIT240120_DishCategory)
// Chức năng:
//   - Hiển thị danh sách loại món
//   - Thêm, sửa, xóa loại món (inline form)
//   - Ràng buộc: không cho xóa loại đang được sử dụng bởi món ăn
//   - Hiển thị số lượng món ăn thuộc mỗi loại
//   - Hỗ trợ đa ngôn ngữ
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const CategoryListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    categories,
    dishes,
    isLoading,
    error,
    isOnline,
    addCategory,
    editCategory,
    removeCategory,
    refreshCategories,
  } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshCategories();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCategories();
    setRefreshing(false);
  };

  /**
   * Đếm số món ăn thuộc một loại
   */
  const getDishCount = (categoryId) => {
    return dishes.filter(
      (d) => d.BIT240120_DishCategoryId === categoryId
    ).length;
  };

  /**
   * Mở form thêm mới
   */
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormErrors({});
    setShowForm(true);
  };

  /**
   * Mở form chỉnh sửa
   */
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormName(category.BIT240120_Name || '');
    setFormDescription(category.BIT240120_Description || '');
    setFormErrors({});
    setShowForm(true);
  };

  /**
   * Validate form category
   */
  const validateForm = () => {
    const errors = {};
    if (!formName.trim()) {
      errors.name = t('common.required');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Lưu category (thêm mới hoặc cập nhật)
   */
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const categoryData = {
        BIT240120_Name: formName.trim(),
        BIT240120_Description: formDescription.trim(),
      };

      if (editingCategory) {
        await editCategory(
          editingCategory.BIT240120_Id || editingCategory.id,
          categoryData
        );
        Alert.alert(
          t('common.success'),
          [
            t('category.saveSuccess'),
            !isOnline ? t('common.networkError') : '',
          ]
            .filter(Boolean)
            .join('\n')
        );
      } else {
        await addCategory(categoryData);
        Alert.alert(
          t('common.success'),
          [
            t('category.saveSuccess'),
            !isOnline ? t('common.networkError') : '',
          ]
            .filter(Boolean)
            .join('\n')
        );
      }

      setShowForm(false);
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Xóa category
   * Kiểm tra ràng buộc: không cho xóa nếu có dish thuộc category này
   */
  const handleDelete = (category) => {
    const categoryId = category.BIT240120_Id || category.id;
    const dishCount = getDishCount(categoryId);

    if (dishCount > 0) {
      // Không cho xóa - có món ăn đang sử dụng
      Alert.alert(t('common.warning'), t('category.cannotDelete'));
      return;
    }

    Alert.alert(
      t('category.delete'),
      t('category.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCategory(categoryId);
              Alert.alert(t('common.success'), t('category.deleteSuccess'));
            } catch (error) {
              if (error.message === 'CATEGORY_IN_USE') {
                Alert.alert(t('common.warning'), t('category.cannotDelete'));
              } else {
                Alert.alert(t('common.error'), error.message);
              }
            }
          },
        },
      ]
    );
  };

  /**
   * Render category item
   */
  const renderCategoryItem = ({ item }) => {
    const categoryId = item.BIT240120_Id || item.id;
    const dishCount = getDishCount(categoryId);

    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryIcon}>
          <Ionicons name="restaurant" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.BIT240120_Name}</Text>
          {item.BIT240120_Description ? (
            <Text style={styles.categoryDescription} numberOfLines={2}>
              {item.BIT240120_Description}
            </Text>
          ) : null}
          <View style={styles.dishCountBadge}>
            <Ionicons name="fast-food-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.dishCountText}>
              {dishCount} {t('tabs.dishes').toLowerCase()}
            </Text>
          </View>
        </View>
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenEdit(item)}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.info} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={dishCount > 0 ? COLORS.textLight : COLORS.error}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyText}>{t('category.noCategories')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('category.list')}</Text>
          <Text style={styles.headerSubtitle}>BIT240120 - Trần Gia Khánh</Text>
        </View>
        <TouchableOpacity style={styles.addHeaderButton} onPress={handleOpenAdd}>
          <Ionicons name="add" size={24} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {t('common.error')}: {error}
          </Text>
          <TouchableOpacity onPress={refreshCategories}>
            <Text style={styles.errorRetry}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item, index) =>
            String(item.BIT240120_Id || item.id || index)
          }
          renderItem={renderCategoryItem}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={[
            styles.listContent,
            categories.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showForm} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowForm(false)}
        >
          <View style={styles.formModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.formTitle}>
              {editingCategory ? t('category.edit') : t('category.add')}
            </Text>

            <Text style={styles.formLabel}>
              {t('category.name')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.formInput, formErrors.name && styles.inputError]}
              value={formName}
              onChangeText={(text) => {
                setFormName(text);
                if (formErrors.name) setFormErrors({});
              }}
              placeholder={t('category.name')}
              placeholderTextColor={COLORS.textLight}
            />
            {formErrors.name && (
              <Text style={styles.formErrorText}>{formErrors.name}</Text>
            )}

            <Text style={styles.formLabel}>{t('category.description')}</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder={t('category.description')}
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorBanner: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
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
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  categoryDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dishCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dishCountText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formModal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    width: '85%',
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  required: {
    color: COLORS.error,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formErrorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xxl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
});

export default CategoryListScreen;
