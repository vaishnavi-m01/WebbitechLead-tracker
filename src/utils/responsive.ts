import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const wp = (size: number) => (width / 100) * size;
export const hp = (size: number) => (height / 100) * size;

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) =>
  (width / guidelineBaseWidth) * size;

export const verticalScale = (size: number) =>
  (height / guidelineBaseHeight) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const fontScale = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(moderateScale(size)));

export const IS_TABLET = width >= 768;

export const PANEL_WIDTH = Math.min(SCREEN_WIDTH - scale(24), scale(400));
export const TILE_SIZE = (PANEL_WIDTH - scale(48) - scale(12)) / 4;
export const TILE_SINGLE = TILE_SIZE * 1.5 + scale(4);