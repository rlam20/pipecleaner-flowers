export const getFlowerImage = (flowerName: string): string => {
  const flowerImages: { [key: string]: string } = {
    "Lily (Small)": "/flowers/lily_small.jpg",
    "Lily (Large)": "/flowers/lily_large.jpg",
    "Rose": "/flowers/rose.jpg",
    "Stargazer Lily (Small)": "/flowers/stargazer_small.jpg",
    "Stargazer Lily (Large)": "/flowers/stargazer_large.jpg",
    "Lavender": "/flowers/lavender.jpg",
    "Hibiscus": "/flowers/hibiscus.jpg",
    "Dahlia": "/flowers/dahlia.jpg",
    "Laceleaf": "/flowers/laceleaf.jpg",
  };

  return flowerImages[flowerName] || "/flowers/default.jpg";
};