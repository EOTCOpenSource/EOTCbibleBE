import { Document, Model, SortOrder } from "mongoose";

interface PaginationResult<T> {
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
  //A validation of page and limit
  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;

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
