import { AppDataSource } from "../appDataSource.js";
import { Property } from "../entities/Property.js";

/**
 * Returns the TypeORM repository for the Property entity.
 * Must be called after AppDataSource.initialize() has resolved.
 */
export const getPropertyRepository = () => AppDataSource.getRepository(Property);
