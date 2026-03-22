import { AppDataSource } from "../appDataSource.js";
import { User } from "../entities/User.js";

/**
 * Returns the TypeORM repository for the User entity.
 * Must be called after AppDataSource.initialize() has resolved.
 */
export const getUserRepository = () => AppDataSource.getRepository(User);
