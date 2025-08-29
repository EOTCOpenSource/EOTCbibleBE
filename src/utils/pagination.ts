// Pagination utility functions

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

/**
 * Parse pagination parameters from query string
 * @param query - Express query object
 * @param defaultLimit - Default items per page (default: 10)
 * @param maxLimit - Maximum items per page (default: 100)
 * @returns PaginationOptions object
 */
export const parsePaginationQuery = (
    query: PaginationQuery,
    defaultLimit: number = 10,
    maxLimit: number = 100
): PaginationOptions => {
    const page = Math.max(1, parseInt(query.page || '1') || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit || defaultLimit.toString()) || defaultLimit));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Create pagination result object
 * @param data - Array of items
 * @param totalItems - Total number of items in collection
 * @param currentPage - Current page number
 * @param itemsPerPage - Items per page
 * @returns PaginationResult object
 */
export const createPaginationResult = <T>(
    data: T[],
    totalItems: number,
    currentPage: number,
    itemsPerPage: number
): PaginationResult<T> => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
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
            hasPrevPage
        }
    };
};

/**
 * Apply pagination to a Mongoose query
 * @param query - Mongoose query object
 * @param paginationOptions - Pagination options
 * @returns Modified query with pagination applied
 */
export const applyPagination = (query: any, paginationOptions: PaginationOptions) => {
    return query.skip(paginationOptions.skip).limit(paginationOptions.limit);
};
