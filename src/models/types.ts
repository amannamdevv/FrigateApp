export interface Camera {
  name: string;
  detect: {
    enabled: boolean;
  };
  record: {
    enabled: boolean;
  };
  snapshots: {
    enabled: boolean;
  };
  width: number;
  height: number;
}

export interface FrigateEvent {
  id: string;
  label: string;
  camera: string;
  start_time: number;
  end_time: number | null;
  top_score: number;
  false_positive: boolean;
  zones: string[];
  thumbnail: string;
  has_clip: boolean;
  has_snapshot: boolean;
}

export interface Recording {
  id: string;
  camera: string;
  start_time: number;
  end_time: number;
  path: string;
  segment_size: number;
}
