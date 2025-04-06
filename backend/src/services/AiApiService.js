// neuroforge/backend/src/services/AiApiService.js
// Purpose: Manages interactions with various AI APIs (Azure, OpenAI, Anthropic etc.)

const axios = require('axios');
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');
const axiosRetry = require('axios-retry');
const config = require('../config');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

// Azure Key Vault setup
const keyVaultUrl = config.keyVault.url; // e.g., "https://neuroforge-vault.vault.azure.net"
const credential = new DefaultAzureCredential();
const keyVaultClient = new SecretClient(keyVaultUrl, credential);

class AiApiService {
    constructor() {
        // Initialize axios clients with retry logic
        this.openaiClient = axios.create({
            baseURL: 'https://api.openai.com/v1',
            headers: { 'Content-Type': 'application/json' }
        });
        this.anthropicClient = axios.create({
            baseURL: 'https://api.anthropic.com/v1',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': '' // Set dynamically later
            }
        });

        // Add retry logic for both clients (3 retries, exponential backoff)
        axiosRetry(this.openaiClient, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
        axiosRetry(this.anthropicClient, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

        // Placeholder for key caching
        this.apiKeys = {};
    }

    // Fetch API key from Azure Key Vault with caching
    async getApiKey(provider) {
        if (this.apiKeys[provider]) {
            logger.debug(`Using cached ${provider} API key`);
            return this.apiKeys[provider];
        }

        try {
            const secretName = provider === 'openai' ? 'openai-api-key' : 'anthropic-api-key';
            logger.debug(`Fetching ${provider} key from Key Vault`);
            const secret = await keyVaultClient.getSecret(secretName);
            this.apiKeys[provider] = secret.value;
            return secret.value;
        } catch (error) {
            logger.error(`Failed to fetch ${provider} key from Key Vault:`, error.message);
            throw new ApiError('AI service configuration error', 500);
        }
    }

    async getTutorResponse({ userId, message, context, preferredStyle, preferredPersonality }) {
        logger.debug(`Getting AI tutor response for user ${userId}. Style: ${preferredStyle}, Personality: ${preferredPersonality}`);

        // Determine provider and model based on context/preferences
        const useAnthropic = preferredStyle === 'creative' || preferredPersonality === 'playful'; // Example rule
        const provider = useAnthropic ? 'anthropic' : 'openai';
        const model = useAnthropic ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview';

        // Fetch API key dynamically
        const apiKey = await this.getApiKey(provider);
        const client = useAnthropic ? this.anthropicClient : this.openaiClient;
        client.defaults.headers[useAnthropic ? 'x-api-key' : 'Authorization'] = useAnthropic ? apiKey : `Bearer ${apiKey}`;

        // Construct prompt
        const systemPrompt = `You are NeuroForge AI Tutor, an expert educator using advanced learning techniques. Your current personality is '${preferredPersonality || 'neutral expert'}' and teaching style is '${preferredStyle || 'socratic'}'. Adapt your response based on this. The user (ID: ${userId}) is currently learning about: ${JSON.stringify(context)}. Keep responses concise and focused.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ];

        // API call
        try {
            logger.debug(`Sending request to ${provider} model: ${model}`);
            const response = await client.post(
                useAnthropic ? '/messages' : '/chat/completions',
                {
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 150,
                    ...(useAnthropic ? { max_tokens: 150 } : {}) // Anthropic uses same param name
                }
            );

            const reply = useAnthropic 
                ? response.data.content[0]?.text 
                : response.data.choices[0]?.message?.content;

            if (!reply) {
                throw new Error('Invalid response structure from AI API');
            }

            logger.debug(`Received ${provider} response: ${reply.substring(0, 50)}...`);
            // TODO: Store interaction in chat history DB
            return { text: reply };

        } catch (error) {
            logger.error(`Error calling ${provider} API:`, error.response?.data || error.message);
            let statusCode = 500;
            let errorMessage = 'AI service unavailable.';

            if (error.response) {
                if (error.response.status === 429) {
                    statusCode = 429;
                    errorMessage = 'AI service rate limit exceeded. Please try again shortly.';
                } else if (error.response.status === 401) {
                    statusCode = 500;
                    errorMessage = 'AI service configuration error.';
                } else if (error.response.data?.error?.code === 'content_filter') {
                    statusCode = 400;
                    errorMessage = 'Request blocked due to content policy. Please rephrase your message.';
                }
            }

            throw new ApiError(errorMessage, statusCode);
        }
    }
    async generateQuiz({ userId, lessonContent }) {
        logger.debug(`Generating quiz for user ${userId}`);

        // Use OpenAI for quiz generation (could extend to Anthropic later)
        const provider = 'openai';
        const model = 'gpt-4-turbo-preview';
        const apiKey = await this.getApiKey(provider);
        this.openaiClient.defaults.headers['Authorization'] = `Bearer ${apiKey}`;

        const prompt = `Given this lesson content: "${lessonContent}", generate 3 multiple-choice questions with 4 options each (A-D). Include the correct answer and a brief explanation. Format the response as JSON. Example:
        [
            {
                "question": "What is 2+2?",
                "options": ["A) 3", "B) 4", "C) 5", "D) 6"],
                "answer": "B",
                "explanation": "2+2 equals 4."
            }
        ]`;

        try {
            logger.debug(`Sending quiz generation request to ${provider} model: ${model}`);
            const response = await this.openaiClient.post('/chat/completions', {
                model,
                messages: [
                    { role: 'system', content: 'You are a quiz-generating AI for NeuroForge.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            const quizText = response.data.choices[0]?.message?.content;
            if (!quizText) {
                throw new Error('Invalid quiz response from AI API');
            }

            // Parse and validate JSON response
            let quiz;
            try {
                quiz = JSON.parse(quizText);
                if (!Array.isArray(quiz) || quiz.length === 0) {
                    throw new Error('Quiz response is not a valid array');
                }
            } catch (parseError) {
                logger.error(`Failed to parse quiz JSON: ${quizText}`);
                throw new ApiError('Failed to generate valid quiz format', 500);
            }

            logger.debug(`Generated quiz: ${JSON.stringify(quiz).substring(0, 50)}...`);
            return quiz;

        } catch (error) {
            logger.error(`Error generating quiz with ${provider}:`, error.response?.data || error.message);
            let statusCode = 500;
            let errorMessage = 'Failed to generate quiz';
            if (error.response?.status === 429) {
                statusCode = 429;
                errorMessage = 'AI service rate limit exceeded. Try again later.';
            }
            throw new ApiError(errorMessage, statusCode);
        }
    }
}

// Export a singleton instance
module.exports = new AiApiService();