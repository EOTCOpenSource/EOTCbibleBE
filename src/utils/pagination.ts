import { Document, Model, SortOrder } from 'mongoose';

// Interfaces
export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

// Parse pagination parameters from query
export const parsePaginationQuery = (
  query: PaginationQuery,
  defaultLimit: number = 10,
  maxLimit: number = 100
): PaginationOptions => {
  const page = Math.max(1, parseInt(query.page || '1') || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(query.limit || defaultLimit.toString()) || defaultLimit)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Create pagination result object
export const createPaginationResult = <T>(
  data: T[],
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    data,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage,
      hasPrevPage,
    },
  };
};

// Apply pagination to a Mongoose query
export const applyPagination = (query: any, paginationOptions: PaginationOptions) => {
  return query.skip(paginationOptions.skip).limit(paginationOptions.limit);
};

// Backward-compatible simple paginate function
export const paginate = async <T extends Document>(
  model: Model<T>,
  query: Record<string, any>,
  page: number = 1,
  limit: number = 10,
  sort: Record<string, SortOrder> = { createdAt: -1 }
): Promise<PaginationResult<T>> => {
  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;

  const skip = (page - 1) * limit;
  const totalItems = await model.countDocuments(query);
  const data = await model.find(query).sort(sort).skip(skip).limit(limit).lean();
  return createPaginationResult<T>(data as any, totalItems, page, limit);
};
