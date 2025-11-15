import type { SelectOption } from './types';

type TFunction = (key: string) => string;

export const getAspectRatioOptions = (t: TFunction): SelectOption[] => [
  { value: "16:9", label: t('constants.aspectRatios.widescreen') },
  { value: "9:16", label: t('constants.aspectRatios.vertical') },
  { value: "1:1", label: t('constants.aspectRatios.square') },
  { value: "4:3", label: t('constants.aspectRatios.classic') },
  { value: "2.39:1", label: t('constants.aspectRatios.cinemascope') },
];

export const getArtisticStyleOptions = (t: TFunction): SelectOption[] => [
  { value: "photorealistic", label: t('constants.artisticStyles.photorealistic') },
  { value: "cinematic", label: t('constants.artisticStyles.cinematic') },
  { value: "pixar animation style", label: t('constants.artisticStyles.pixar') },
  { value: "disney animation style", label: t('constants.artisticStyles.disney') },
  { value: "modern anime style", label: t('constants.artisticStyles.anime') },
  { value: "ghibli studio style", label: t('constants.artisticStyles.ghibli') },
  { value: "watercolor painting", label: t('constants.artisticStyles.watercolor') },
  { value: "oil painting", label: t('constants.artisticStyles.oilPainting') },
  { value: "charcoal sketch", label: t('constants.artisticStyles.charcoal') },
  { value: "comic book art", label: t('constants.artisticStyles.comicBook') },
  { value: "steampunk", label: t('constants.artisticStyles.steampunk') },
  { value: "cyberpunk", label: t('constants.artisticStyles.cyberpunk') },
  { value: "fantasy art", label: t('constants.artisticStyles.fantasy') },
  { value: "impressionism", label: t('constants.artisticStyles.impressionism') },
  { value: "surrealism", label: t('constants.artisticStyles.surrealism') },
  { value: "minimalist line art", label: t('constants.artisticStyles.minimalist') },
  { value: "vintage photography", label: t('constants.artisticStyles.vintage') },
  { value: "low poly 3d", label: t('constants.artisticStyles.lowPoly') },
  { value: "A Pixar/Disney style 3D animation, , realistic texture, , detailed background, cinematic, photorealistic rendering.", label: t('constants.artisticStyles.pixar3dRealistic') },
  { value: "film noir", label: t('constants.artisticStyles.filmNoir') },
  { value: "vaporwave", label: t('constants.artisticStyles.vaporwave') },
  { value: "art deco", label: t('constants.artisticStyles.artDeco') },
  { value: "gothic art", label: t('constants.artisticStyles.gothic') },
  { value: "claymation", label: t('constants.artisticStyles.claymation') },
  { value: "pixel art", label: t('constants.artisticStyles.pixelArt') },
  { value: "synthwave", label: t('constants.artisticStyles.synthwave') },
];

export const getLightingStyleOptions = (t: TFunction): SelectOption[] => [
  { value: "natural morning light", label: t('constants.lighting.morning') },
  { value: "bright daylight", label: t('constants.lighting.daylight') },
  { value: "sunset / golden hour", label: t('constants.lighting.sunset') },
  { value: "moody, overcast sky", label: t('constants.lighting.overcast') },
  { value: "soft diffused lighting", label: t('constants.lighting.soft') },
  { value: "night cinematic lighting", label: t('constants.lighting.night') },
  { value: "neon cyberpunk lighting", label: t('constants.lighting.cyberpunk') },
  { value: "candlelight / firelight", label: t('constants.lighting.candlelight') },
  { value: "flashlight / single source dramatic lighting", label: t('constants.lighting.flashlight') },
  { value: "horror dim light", label: t('constants.lighting.horror') },
  { value: "studio lighting", label: t('constants.lighting.studio') },
  { value: "volumetric lighting", label: t('constants.lighting.volumetric') },
  { value: "rim lighting", label: t('constants.lighting.rim') },
  { value: "backlight / silhouette", label: t('constants.lighting.backlight') },
  { value: "chiaroscuro lighting", label: t('constants.lighting.chiaroscuro') },
  { value: "mystical / bioluminescent glow", label: t('constants.lighting.mystical') },
  { value: "dramatic stage lighting", label: t('constants.lighting.stage') },
  { value: "underwater caustics", label: t('constants.lighting.underwater') },
  { value: "dappled sunlight through leaves", label: t('constants.lighting.dappled') },
  { value: "holographic glow", label: t('constants.lighting.holographic') },
  { value: "ultraviolet / blacklight", label: t('constants.lighting.blacklight') },
];

export const getCameraPerspectiveOptions = (t: TFunction): SelectOption[] => [
  { value: "eye-level shot", label: t('constants.perspectives.eyeLevel') },
  { value: "establishing shot", label: t('constants.perspectives.establishing') },
  { value: "wide shot", label: t('constants.perspectives.wide') },
  { value: "full shot", label: t('constants.perspectives.full') },
  { value: "medium shot", label: t('constants.perspectives.medium') },
  { value: "cowboy shot (american shot)", label: t('constants.perspectives.cowboy') },
  { value: "close-up shot", label: t('constants.perspectives.closeUp') },
  { value: "extreme close-up shot", label: t('constants.perspectives.extremeCloseUp') },
  { value: "high-angle shot", label: t('constants.perspectives.highAngle') },
  { value: "low-angle shot", label: t('constants.perspectives.lowAngle') },
  { value: "overhead shot / bird's-eye view", label: t('constants.perspectives.overhead') },
  { value: "worm's-eye view", label: t('constants.perspectives.wormEye') },
  { value: "dutch angle (canted angle)", label: t('constants.perspectives.dutch') },
  { value: "over-the-shoulder shot", label: t('constants.perspectives.overShoulder') },
  { value: "point-of-view shot", label: t('constants.perspectives.pov') },
  { value: "two-shot", label: t('constants.perspectives.twoShot') },
];

export const getNumberOfImagesOptions = (t: TFunction): SelectOption[] => [
  { value: "1", label: t('constants.imageCount.one') },
  { value: "2", label: t('constants.imageCount.two') },
  { value: "3", label: t('constants.imageCount.three') },
  { value: "4", label: t('constants.imageCount.four') },
];