import { ChatOpenAI } from '@langchain/openai'

const model = new ChatOpenAI({
  modelName: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0,
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://finshield.pk',
      'X-Title': 'FinShield PK',
    },
  },
})