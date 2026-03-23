import { Model, Document, UpdateQuery } from 'mongoose';

// Mongoose 9 uses mongodb's QueryFilter internally — use a generic object type for filter params
type FilterParam<T> = T extends Document ? Record<string, unknown> : never;

export class BaseRepository<T extends Document> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findAll(filter: Record<string, unknown> = {}): Promise<T[]> {
    return this.model.find(filter as FilterParam<T>).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    return this.model.findOne(filter as FilterParam<T>).exec();
  }

  async create(data: Record<string, unknown>): Promise<T> {
    const doc = new this.model(data);
    return doc.save() as Promise<T>;
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments(filter as FilterParam<T>).exec();
  }
}
