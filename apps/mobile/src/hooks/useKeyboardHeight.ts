import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Ochilgan klaviatura balandligini qaytaradi (yopiq bo'lsa 0).
 *
 * NEGA KERAK: Android'da ekran har doim ham qisqarmaydi — natijada pastdagi
 * maydon klaviatura ostida qolib ketadi. Shu balandlikni ro'yxat tagiga
 * qo'shsak, oxirgi maydongacha bemalol aylantirib borish mumkin bo'ladi.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // iOS'da "will" hodisalari silliqroq, Android'da faqat "did" bor
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
