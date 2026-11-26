import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  DB_HOST: Joi.string().default('127.0.0.1'),
  DB_PORT: Joi.number().port().default(3306),
  DB_USER: Joi.string().default('root'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().default('pizza_empire_tycoon'),
  DB_CONNECTION_LIMIT: Joi.number().integer().min(1).max(100).default(10),
  JWT_ACCESS_SECRET: Joi.string().min(16).default('dev_access_secret_change_in_prod_32chars'),
  JWT_REFRESH_SECRET: Joi.string().min(16).default('dev_refresh_secret_change_in_prod_32chars'),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().integer().min(4).max(15).default(12),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(10).default(300),
})
  .unknown(true)
  .required();

const { value, error } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

export const env = {
  nodeEnv: value.NODE_ENV as 'development' | 'test' | 'production',
  port: value.PORT as number,
  corsOrigin: value.CORS_ORIGIN as string,
  db: {
    host: value.DB_HOST as string,
    port: value.DB_PORT as number,
    user: value.DB_USER as string,
    password: value.DB_PASSWORD as string,
    database: value.DB_NAME as string,
    connectionLimit: value.DB_CONNECTION_LIMIT as number,
  },
  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET as string,
    refreshSecret: value.JWT_REFRESH_SECRET as string,
    accessExpiresIn: value.JWT_ACCESS_EXPIRES_IN as string,
    refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN as string,
  },
  security: {
    bcryptRounds: value.BCRYPT_ROUNDS as number,
    rateLimitWindowMs: value.RATE_LIMIT_WINDOW_MS as number,
    rateLimitMaxRequests: value.RATE_LIMIT_MAX_REQUESTS as number,
  },
};
