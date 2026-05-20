/**
 * Static demo listing images served from /public/mock_images/.
 * Keep in sync with seed_demo.py DEMO_APARTMENTS image URLs.
 */
export const MOCK_IMAGE_ASSETS = {
  image1: '/mock_images/image1.jpg',
  image2: '/mock_images/image2.jpg',
  image3: '/mock_images/image3.jpg',
  image4: '/mock_images/image4.jpg',
  image5: '/mock_images/image5.jpg',
} as const;

/** One distinct hero/gallery set per sample listing area */
export const DEMO_LISTING_IMAGES = {
  rothschild: [MOCK_IMAGE_ASSETS.image2],
  givatayim: [MOCK_IMAGE_ASSETS.image3],
  neveTzedek: [
    MOCK_IMAGE_ASSETS.image4,
    MOCK_IMAGE_ASSETS.image5,
    MOCK_IMAGE_ASSETS.image1,
  ],
} as const;
