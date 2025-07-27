import { LazyExoticComponent, ComponentType } from 'react';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  valueUnit: string;
}

export interface LazyComponents {
  [key: string]: LazyExoticComponent<ComponentType<any>>;
}

export interface ImageOptimizationConfig {
  formats: string[];
  sizes: {
    mobile: number[];
    tablet: number[];
    desktop: number[];
    retina: number[];
  };
  quality: {
    jpeg: number;
    webp: number;
    avif: number;
  };
  loading: 'lazy';
  placeholder: string;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  optimizerOptions: {
    mozjpeg: {
      quality: number;
      progressive: boolean;
    };
    webp: {
      quality: number;
      lossless: boolean;
      nearLossless: boolean;
    };
    avif: {
      quality: number;
      speed: number;
    };
  };
}

export interface CacheConfig {
  staticAssets: {
    maxAge: number;
    immutable: boolean;
  };
  dynamicContent: {
    maxAge: number;
    revalidate: boolean;
  };
}

export interface CodeSplitConfig {
  minChunkSize: number;
  maxInitialRequests: number;
  maxAsyncRequests: number;
}
