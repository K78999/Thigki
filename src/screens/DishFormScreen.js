// ============================================================
// BIT240120_FoodManager - Dish Form Screen (Create / Edit)
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Form thêm mới hoặc chỉnh sửa món ăn
// Chức năng:
//   - Nhập: tên, giá, thời gian chế biến, mô tả, trạng thái
//   - Chọn loại món từ dữ liệu lưu trữ (picker)
//   - Quản lý ảnh: thêm URL, chọn thumbnail, xóa ảnh
//   - Validation đầy đủ:
//     + Name không rỗng
//     + Price > 0
//     + PreparationTime > 0
//     + DishCategoryId hợp lệ
//     + Tên không trùng trong cùng loại
//     + URL ảnh hợp lệ
//   - Hỗ trợ đa ngôn ngữ cho tất cả nhãn, nút, thông báo
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const DishFormScreen = ({ route, navigation }) => {
  const { dishId } = route.params || {};
  const isEditing = !!dishId;
  const { t } = useTranslation();
  const { dishes, categories, addDish, editDish, isOnline } = useData();

  // ========================
  // FORM STATE
  // Tất cả trường dữ liệu có tiền tố BIT240120_
  // ========================
  const [formData, setFormData] = useState({
    BIT240120_Name: '',
    BIT240120_Price: '',
    BIT240120_PreparationTime: '',
    BIT240120_Description: '',
    BIT240120_IsAvailable: true,
    BIT240120_DishCategoryId: '',
    BIT240120_DishImage: [],
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Load dữ liệu khi edit
  useEffect(() => {
    if (isEditing && dishId) {
      const dish = dishes.find(
        (d) => d.BIT240120_Id === dishId || d.id === dishId
      );
      if (dish) {
        const dishImages = Array.isArray(dish.BIT240120_DishImage)
          ? dish.BIT240120_DishImage
          : [];
        const thumbnailIndex = dishImages.findIndex(
          (image) => image.BIT240120_IsThumbnail
        );
        setFormData({
          BIT240120_Name: dish.BIT240120_Name || '',
          BIT240120_Price: String(dish.BIT240120_Price || ''),
          BIT240120_PreparationTime: String(
            dish.BIT240120_PreparationTime || ''
          ),
          BIT240120_Description: dish.BIT240120_Description || '',
          BIT240120_IsAvailable: dish.BIT240120_IsAvailable !== false,
          BIT240120_DishCategoryId: dish.BIT240120_DishCategoryId || '',
          BIT240120_DishImage: dishImages.map((image, index) => ({
            ...image,
            BIT240120_IsThumbnail: index === thumbnailIndex,
          })),
        });
      } else {
        // Dish không tồn tại
        Alert.alert(t('common.error'), t('common.idNotFound'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
      }
    }
  }, [dishId, isEditing]);

  /**
   * Cập nhật giá trị field
   * Xóa lỗi của field khi user bắt đầu nhập
   */
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Validate toàn bộ form
   * Kiểm tra:
   *   1. Name không rỗng
   *   2. Price > 0
   *   3. PreparationTime > 0
   *   4. DishCategoryId đã chọn và hợp lệ
   *   5. Tên không trùng trong cùng loại (trừ chính nó khi edit)
   * @returns {boolean} - true nếu hợp lệ
   */
  const validateForm = () => {
    const newErrors = {};

    // 1. Validate Name
    if (!formData.BIT240120_Name.trim()) {
      newErrors.BIT240120_Name = t('common.required');
    }

    // 2. Validate Price
    const price = Number(formData.BIT240120_Price);
    if (
      !formData.BIT240120_Price ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      newErrors.BIT240120_Price = t('common.invalidPrice');
    }

    // 3. Validate PreparationTime
    const prepTime = Number(formData.BIT240120_PreparationTime);
    if (
      !formData.BIT240120_PreparationTime ||
      !Number.isFinite(prepTime) ||
      prepTime <= 0
    ) {
      newErrors.BIT240120_PreparationTime = t('common.invalidPrepTime');
    }

    // 4. Validate Category
    if (!formData.BIT240120_DishCategoryId) {
      newErrors.BIT240120_DishCategoryId = t('common.invalidCategory');
    } else {
      const categoryExists = categories.some(
        (cat) =>
          cat.BIT240120_Id === formData.BIT240120_DishCategoryId ||
          cat.id === formData.BIT240120_DishCategoryId
      );
      if (!categoryExists) {
        newErrors.BIT240120_DishCategoryId = t('common.invalidCategory');
      }
    }

    // 5. Validate duplicate name in same category
    const duplicate = dishes.find(
      (d) =>
        (d.BIT240120_Name || '').toLowerCase().trim() ===
          formData.BIT240120_Name.toLowerCase().trim() &&
        d.BIT240120_DishCategoryId === formData.BIT240120_DishCategoryId &&
        (isEditing ? (d.BIT240120_Id || d.id) !== dishId : true)
    );
    if (duplicate) {
      newErrors.BIT240120_Name = t('common.duplicateName');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Lưu form (Create hoặc Update)
   * Xây dựng object với tất cả trường có tiền tố BIT240120_
   */
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const dishData = {
        BIT240120_Name: formData.BIT240120_Name.trim(),
        BIT240120_Price: Number(formData.BIT240120_Price),
        BIT240120_PreparationTime: Number(formData.BIT240120_PreparationTime),
        BIT240120_Description: formData.BIT240120_Description.trim(),
        BIT240120_IsAvailable: formData.BIT240120_IsAvailable,
        BIT240120_DishCategoryId: formData.BIT240120_DishCategoryId,
        BIT240120_DishImage: formData.BIT240120_DishImage,
      };

      if (isEditing) {
        await editDish(dishId, dishData);
        Alert.alert(
          t('common.success'),
          [
            t('dish.updateSuccess'),
            !isOnline ? t('common.networkError') : '',
          ]
            .filter(Boolean)
            .join('\n')
        );
      } else {
        await addDish(dishData);
        Alert.alert(
          t('common.success'),
          [
            t('dish.createSuccess'),
            !isOnline ? t('common.networkError') : '',
          ]
            .filter(Boolean)
            .join('\n')
        );
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Thêm ảnh mới bằng URL
   * Validate URL trước khi thêm
   * Ảnh đầu tiên tự động thành thumbnail
   */
  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      Alert.alert(t('common.error'), t('common.invalidUrl'));
      return;
    }

    // Validate URL format cơ bản
    const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlPattern.test(newImageUrl.trim())) {
      Alert.alert(t('common.error'), t('common.invalidUrl'));
      return;
    }

    const isFirst = formData.BIT240120_DishImage.length === 0;
    const newImage = {
      BIT240120_ImageUrl: newImageUrl.trim(),
      BIT240120_IsThumbnail: isFirst, // Ảnh đầu tiên là thumbnail
    };

    updateField('BIT240120_DishImage', [
      ...formData.BIT240120_DishImage,
      newImage,
    ]);
    setNewImageUrl('');
    setShowImageModal(false);
  };

  /**
   * Xóa ảnh khỏi danh sách
   * Nếu ảnh bị xóa là thumbnail, tự động chuyển thumbnail sang ảnh đầu tiên
   */
  const handleRemoveImage = (index) => {
    const images = [...formData.BIT240120_DishImage];
    const removedImage = images[index];
    images.splice(index, 1);

    // Nếu xóa thumbnail, đặt ảnh đầu tiên làm thumbnail
    if (removedImage.BIT240120_IsThumbnail && images.length > 0) {
      images[0].BIT240120_IsThumbnail = true;
    }

    updateField('BIT240120_DishImage', images);
  };

  /**
   * Đặt ảnh làm thumbnail
   * Đảm bảo tối đa 1 ảnh IsThumbnail = true
   */
  const handleSetThumbnail = (index) => {
    const images = formData.BIT240120_DishImage.map((img, i) => ({
      ...img,
      BIT240120_IsThumbnail: i === index,
    }));
    updateField('BIT240120_DishImage', images);
  };

  /**
   * Lấy tên category đã chọn
   */
  const getSelectedCategoryName = () => {
    const cat = categories.find(
      (c) =>
        c.BIT240120_Id === formData.BIT240120_DishCategoryId ||
        c.id === formData.BIT240120_DishCategoryId
    );
    return cat ? cat.BIT240120_Name : t('common.invalidCategory');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t('dish.edit') : t('dish.add')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.formContent}
      >
        {/* Tên món ăn */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('dish.name')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.BIT240120_Name && styles.inputError]}
            value={formData.BIT240120_Name}
            onChangeText={(text) => updateField('BIT240120_Name', text)}
            placeholder={t('dish.name')}
            placeholderTextColor={COLORS.textLight}
          />
          {errors.BIT240120_Name && (
            <Text style={styles.errorText}>{errors.BIT240120_Name}</Text>
          )}
        </View>

        {/* Giá và Thời gian chế biến (cùng hàng) */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              {t('dish.price')} ($) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.BIT240120_Price && styles.inputError]}
              value={formData.BIT240120_Price}
              onChangeText={(text) => updateField('BIT240120_Price', text)}
              placeholder="0.00"
              placeholderTextColor={COLORS.textLight}
              keyboardType="decimal-pad"
            />
            {errors.BIT240120_Price && (
              <Text style={styles.errorText}>{errors.BIT240120_Price}</Text>
            )}
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              {t('dish.prepTime')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors.BIT240120_PreparationTime && styles.inputError,
              ]}
              value={formData.BIT240120_PreparationTime}
              onChangeText={(text) =>
                updateField('BIT240120_PreparationTime', text)
              }
              placeholder="0"
              placeholderTextColor={COLORS.textLight}
              keyboardType="number-pad"
            />
            {errors.BIT240120_PreparationTime && (
              <Text style={styles.errorText}>
                {errors.BIT240120_PreparationTime}
              </Text>
            )}
          </View>
        </View>

        {/* Loại món ăn (Picker) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('dish.category')} <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              errors.BIT240120_DishCategoryId && styles.inputError,
            ]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text
              style={[
                styles.pickerText,
                !formData.BIT240120_DishCategoryId && styles.pickerPlaceholder,
              ]}
            >
              {formData.BIT240120_DishCategoryId
                ? getSelectedCategoryName()
                : t('common.invalidCategory')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
          {errors.BIT240120_DishCategoryId && (
            <Text style={styles.errorText}>
              {errors.BIT240120_DishCategoryId}
            </Text>
          )}
        </View>

        {/* Mô tả */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('dish.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.BIT240120_Description}
            onChangeText={(text) => updateField('BIT240120_Description', text)}
            placeholder={t('dish.description')}
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Trạng thái */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>{t('dish.status')}</Text>
            <Text style={styles.switchDescription}>
              {formData.BIT240120_IsAvailable
                ? t('dish.available')
                : t('dish.unavailable')}
            </Text>
          </View>
          <Switch
            value={formData.BIT240120_IsAvailable}
            onValueChange={(value) =>
              updateField('BIT240120_IsAvailable', value)
            }
            trackColor={{ false: COLORS.border, true: COLORS.successLight }}
            thumbColor={
              formData.BIT240120_IsAvailable ? COLORS.success : COLORS.textLight
            }
          />
        </View>

        {/* Quản lý ảnh */}
        <View style={styles.imageSection}>
          <View style={styles.imageSectionHeader}>
            <Text style={styles.label}>{t('dish.images')}</Text>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={() => setShowImageModal(true)}
            >
              <Ionicons name="add" size={18} color={COLORS.textOnPrimary} />
              <Text style={styles.addImageButtonText}>{t('dish.addImage')}</Text>
            </TouchableOpacity>
          </View>

          {/* Danh sách ảnh */}
          {formData.BIT240120_DishImage.length > 0 ? (
            formData.BIT240120_DishImage.map((img, index) => (
              <View key={index} style={styles.imageItem}>
                <Image
                  source={{ uri: img.BIT240120_ImageUrl }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <View style={styles.imageItemInfo}>
                  <Text style={styles.imageUrl} numberOfLines={1}>
                    {img.BIT240120_ImageUrl}
                  </Text>
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={[
                        styles.thumbnailButton,
                        img.BIT240120_IsThumbnail && styles.thumbnailButtonActive,
                      ]}
                      onPress={() => handleSetThumbnail(index)}
                    >
                      <Ionicons
                        name={img.BIT240120_IsThumbnail ? 'star' : 'star-outline'}
                        size={14}
                        color={
                          img.BIT240120_IsThumbnail
                            ? COLORS.accent
                            : COLORS.textLight
                        }
                      />
                      <Text
                        style={[
                          styles.thumbnailButtonText,
                          img.BIT240120_IsThumbnail &&
                            styles.thumbnailButtonTextActive,
                        ]}
                      >
                        {t('dish.thumbnail')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      style={styles.removeImageButton}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noImageBox}>
              <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
              <Text style={styles.noImageBoxText}>{t('dish.noImage')}</Text>
            </View>
          )}
        </View>

        {/* Nút lưu */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.textOnPrimary} />
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>{t('dish.category')}</Text>
            {categories.length === 0 ? (
              <Text style={styles.noCategoriesText}>
                {t('category.noCategories')}
              </Text>
            ) : (
              categories.map((cat) => (
                <TouchableOpacity
                  key={cat.BIT240120_Id || cat.id}
                  style={[
                    styles.pickerItem,
                    formData.BIT240120_DishCategoryId ===
                      (cat.BIT240120_Id || cat.id) && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    updateField(
                      'BIT240120_DishCategoryId',
                      cat.BIT240120_Id || cat.id
                    );
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      formData.BIT240120_DishCategoryId ===
                        (cat.BIT240120_Id || cat.id) &&
                        styles.pickerItemTextActive,
                    ]}
                  >
                    {cat.BIT240120_Name}
                  </Text>
                  {formData.BIT240120_DishCategoryId ===
                    (cat.BIT240120_Id || cat.id) && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Image Modal */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageModal(false)}
        >
          <View style={styles.imageModal}>
            <Text style={styles.imageModalTitle}>{t('dish.addImage')}</Text>
            <TextInput
              style={styles.imageModalInput}
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              placeholder={t('dish.imageUrl')}
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.imageModalActions}>
              <TouchableOpacity
                style={styles.imageModalCancel}
                onPress={() => {
                  setNewImageUrl('');
                  setShowImageModal(false);
                }}
              >
                <Text style={styles.imageModalCancelText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imageModalAdd}
                onPress={handleAddImage}
              >
                <Text style={styles.imageModalAddText}>
                  {t('dish.addImage')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  rowFields: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  pickerText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  pickerPlaceholder: {
    color: COLORS.textLight,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  switchDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Image section
  imageSection: {
    marginBottom: SPACING.xl,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  addImageButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  imageItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  imagePreview: {
    width: 70,
    height: 70,
  },
  imageItemInfo: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  },
  imageUrl: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thumbnailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceVariant,
  },
  thumbnailButtonActive: {
    backgroundColor: COLORS.warningLight,
  },
  thumbnailButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  thumbnailButtonTextActive: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  removeImageButton: {
    padding: SPACING.xs,
  },
  noImageBox: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  noImageBoxText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.md,
    marginTop: SPACING.sm,
  },
  // Save button
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    maxHeight: '60%',
  },
  pickerModalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  noCategoriesText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  pickerItemActive: {
    backgroundColor: COLORS.surfaceVariant,
  },
  pickerItemText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  imageModal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '85%',
  },
  imageModalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  imageModalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  imageModalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  imageModalCancel: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  imageModalCancelText: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  imageModalAdd: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  imageModalAddText: {
    color: COLORS.textOnPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});

export default DishFormScreen;
