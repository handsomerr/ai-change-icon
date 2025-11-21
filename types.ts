export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizedBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export enum AppStep {
  UPLOAD_BASE = 'UPLOAD_BASE',
  SELECT_REGION = 'SELECT_REGION',
  UPLOAD_PATTERN = 'UPLOAD_PATTERN',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
}

export interface ImageAsset {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}
