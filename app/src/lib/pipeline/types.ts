export interface CaptureTokens {
  title: string;
  description: string;
  colors: string[];
  fonts: (string | { family: string; weights?: number[]; variable?: boolean })[];
  headings: (string | { level?: number; text: string; fontSize?: string; fontWeight?: string; color?: string })[];
  ctas: (string | { text: string; href?: string })[];
  sections: {
    heading?: string;
    text?: string;
    type?: string;
    layout?: string;
    backgroundColor?: string;
    callsToAction?: string[];
    assets?: string[];
  }[];
  cssVariables?: Record<string, string>;
}

export interface DesignInference {
  site_dna: {
    brand_primary?: string;
    palette?: string[];
    fonts?: string[];
  };
  preset: string;
  preset_label?: string;
  confidence?: number;
  scores?: Record<string, number>;
}

export interface NarratorScene {
  sceneNumber: number;
  scene_id: string;
  heading: string;
  script: string;
  narrativeIntent: {
    type: string;
    narrativeRole: string;
    keyMessage: string;
    persuasion: string;
    emotionalBeat: string;
  };
  transition: {
    continuity: string;
    intent: string;
  };
  estimatedDuration: number;
}

export interface NarratorScripts {
  project: string;
  premise: string;
  narrativeArchetype: string;
  emotionalArc: string;
  orientation: "landscape" | "portrait" | "square";
  estimatedDuration: number;
  scenes: NarratorScene[];
}

export interface AudioSceneMeta {
  voicePath: string;
  voiceDuration: number;
  wordsPath?: string;
}

export interface AudioMeta {
  tts_provider: string;
  voice_id: string;
  bgm_enabled: boolean;
  total_duration_s: number;
  scenes: Record<string, AudioSceneMeta>;
}

export interface VideoConfig {
  url: string;
  focus: "product-overall" | "headline-feature" | "offer-cta";
  duration: 30 | 60 | 90;
  aspectRatio: "16:9" | "9:16" | "1:1";
  preset: string;
  voice: string;
  scriptMode: "auto" | "custom";
  customScript?: string;
}

export interface ProjectState {
  id: string;
  name: string;
  dir: string;
  url: string;
  status:
    | "created"
    | "capturing"
    | "captured"
    | "configuring"
    | "story-review"
    | "audio-generating"
    | "audio-done"
    | "design-review"
    | "generating"
    | "completed"
    | "error";
  config: Partial<VideoConfig>;
  captureData?: {
    tokens: CaptureTokens;
    inference: DesignInference;
    screenshots: string[];
  };
  pipelinePhase?: string;
  error?: string;
  createdAt: string;
}

export interface PipelineEvent {
  phase: string;
  status: "pending" | "running" | "completed" | "error";
  message?: string;
  progress?: number;
  error?: string;
}

export interface PresetInfo {
  id: string;
  label: string;
  bestFor: string[];
  avoidFor: string[];
}
