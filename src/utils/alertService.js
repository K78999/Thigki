import { Alert as NativeAlert, Platform } from 'react-native';

export const showAlert = (title, message, buttons = []) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    NativeAlert.alert(
      title,
      message,
      buttons.length > 0 ? buttons : undefined
    );
    return;
  }

  const text = [title, message].filter(Boolean).join('\n\n');
  if (buttons.length > 1) {
    const cancelButton = buttons.find((button) => button.style === 'cancel');
    const confirmButton = [...buttons]
      .reverse()
      .find((button) => button.style !== 'cancel');

    if (window.confirm(text)) {
      confirmButton?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
    return;
  }

  window.alert(text);
  buttons[0]?.onPress?.();
};
