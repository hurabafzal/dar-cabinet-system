// config/assetConfig.ts
export const transformModelUrl = (url: string): string => {
    if (!url) return url;
    // If the URL is already transformed or is an absolute URL
    if (url.startsWith('http')) return url;
    // Redirect local URLs to CDN or another source
    return `${process.env.NEXT_PUBLIC_ASSET_BASE_URL || '/assets'}${url}`;
  };
  
  export const transformThumbnailUrl = (url: string): string => {
    // Similar logic as for models
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_THUMBNAIL_BASE_URL || '/thumbnails'}${url}`;
  };
  
  export const transformTextureUrl = (url: string): string => {
    // For textures
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_TEXTURE_BASE_URL || '/textures'}${url}`;
  };