export const MODELS = [
  {
    id: 'deepseek/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    shortName: 'DeepSeek',
    icon: '/icons/deepseek.svg',
    accent: '#4d6bfe',
  },
  {
    id: 'moonshotai/kimi-k2.6',
    name: 'Kimi K2.6',
    shortName: 'Kimi',
    icon: '/icons/moonshot.svg',
    accent: '#111827',
  },
  {
    id: 'zai/glm-5.1',
    name: 'GLM 5.1',
    shortName: 'GLM',
    icon: '/icons/zai.svg',
    accent: '#2563eb',
  },
  {
    id: 'google/gemma-4-26b-a4b-it',
    name: 'Gemma 4 26B',
    shortName: 'Gemma',
    icon: '/icons/google.svg',
    accent: '#ea4335',
  },
] as const

export type ModelConfig = (typeof MODELS)[number]
export type ModelId = ModelConfig['id']

export const MODELS_BY_ID = Object.fromEntries(
  MODELS.map((model) => [model.id, model]),
) as Record<ModelId, ModelConfig>

export const getModel = (id: ModelId) => MODELS_BY_ID[id]
