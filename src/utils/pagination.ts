import { Model, Document, SortOrder } from "mongoose";

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export const paginate = async <T extends Document>(
  model: Model<T>,
  query: Record<string, any>,
  page: number = 1,
  limit: number = 10,
  sort: Record<string, SortOrder> = { createdAt: -1 }
): Promise<PaginationResult<T>> => {
  const skip = (page - 1) * limit;

  const totalItems = await model.countDocuments(query);
  const data = await model.find(query).skip(skip).limit(limit).sort(sort);

  return {
    data,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    },
  };
};
