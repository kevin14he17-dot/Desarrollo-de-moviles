import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findById(id) {
    const result = await executeQuery(
      `SELECT * FROM ${this.tableName} WHERE ${this.tableName}ID = @id`,
      { id }
    );
    return result.recordset[0] || null;
  }

  async findAll(filters = {}, pageSize = 50, pageNumber = 1) {
    let whereClause = 'WHERE 1=1';
    const params = {};

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        whereClause += ` AND ${key} = @${key}`;
        params[key] = value;
      }
    }

    const offset = (pageNumber - 1) * pageSize;
    
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
      params
    );
    
    const total = countResult.recordset[0].total;

    const result = await executeQuery(
      `SELECT * FROM ${this.tableName} ${whereClause} 
       ORDER BY ${this.tableName}ID DESC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      { ...params, offset, pageSize }
    );

    return {
      data: result.recordset,
      pagination: {
        total,
        pageSize,
        pageNumber,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async create(data) {
    const columns = Object.keys(data);
    const values = columns.map(col => `@${col}`).join(', ');
    const columnNames = columns.join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columnNames})
      VALUES (${values});
      SELECT SCOPE_IDENTITY() AS id;
    `;

    const params = {};
    columns.forEach(col => {
      params[col] = data[col];
    });

    const result = await executeQuery(query, params);
    return result.recordset[0].id;
  }

  async update(id, data) {
    const setClause = Object.keys(data)
      .map(key => `${key} = @${key}`)
      .join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, UpdatedAt = GETDATE()
      WHERE ${this.tableName}ID = @id
    `;

    const params = { ...data, id };
    await executeQuery(query, params);
    return true;
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.tableName}ID = @id`;
    await executeQuery(query, { id });
    return true;
  }

  async softDelete(id) {
    const query = `
      UPDATE ${this.tableName}
      SET IsActive = 0, UpdatedAt = GETDATE()
      WHERE ${this.tableName}ID = @id
    `;
    await executeQuery(query, { id });
    return true;
  }
}

export default BaseRepository;
