import azure, { ErrorOrResult, TableService } from 'azure-storage'
import mapValues from 'lodash/mapValues'
import { v4 as uuid } from 'uuid'
import validate from 'aproba'
import { promisify } from 'util'

import { AzureTableResponses, AzureDocument } from '../types/azureDocument'

const tableService: azure.TableService = azure.createTableService(process.env.AZURE_STORAGE_ENDPOINT)
const { entityGenerator: entGen, TableOperators, QueryComparisons } = azure.TableUtilities

// promisifiy all the things
const createTableIfNotExists = promisify(tableService.createTableIfNotExists).bind(tableService)
const insertOrMergeEntity = promisify(tableService.insertOrMergeEntity).bind(tableService)

/**
 * Table storage module
 *
 * Usage: new Storage(tableName)
 * * e.g.
 * * const pens = new Storage('pens')
 * * const a_pen = await pens.findOne('some-id')
 */
class Storage {
  constructor (public tableName: string) {
    validate('S', [process.env.AZURE_STORAGE_ENDPOINT])
    validate('S', arguments)
    this.tableName = tableName
  }

  /**
   * Returns a single document based on provided row key
   *
   * @param {string} rowKey - the row key
   * @param {string} partitionKey - the parition key
   * @return {Object} the document (or null)
   */
  async findOne<T = unknown> (rowKey: string, partitionKey: string): Promise<Record<string, T>|null> {
    const retrieveEntity = promisify((tableKey: string, partitionKey: string, rowKey: string, callback: ErrorOrResult<AzureTableResponses<T>>) => {
      return tableService.retrieveEntity(tableKey, partitionKey, rowKey, callback)
    })

    validate('SS', [rowKey, partitionKey])
    try {
      await createTableIfNotExists(this.tableName)
      const data = await retrieveEntity(this.tableName, partitionKey, rowKey)
      return mapValues(data, ({ _ }) => _)
    } catch (err) {
      console.error(err)
      // don't throw if we can't find anything,
      // that's not desirable
      return null
    }
  }

  /**
   * Returns a selection of documents based on a query
   *
   * @param {Object} query - query parameters (e.g. { PartitionKey: '1234', FirstName: 'Gary' })
   * @param {string} continueToken - if you received a 'next' token from the previous query
   * @return {Object} { items: (an array of results), next: a next token if more results are available }
   */
  async find<T = unknown> (query: {[x: string]: string}, continueToken: azure.TableService.TableContinuationToken): Promise<{ items: Record<string, T>[]; next?: TableService.TableContinuationToken }> {
    const queryEntities = promisify((tableName: string, query: azure.TableQuery, token: TableService.TableContinuationToken, callback: ErrorOrResult<TableService.QueryEntitiesResult<AzureTableResponses<T>>>) => {
      return tableService.queryEntities(tableName, query, token, callback)
    })

    validate('O|OS', [query, continueToken])

    await createTableIfNotExists(this.tableName)
    const tableQuery = this._buildQuery(query)
    const { entries, continuationToken } = await queryEntities(this.tableName, tableQuery, continueToken)
    const items = entries.map((entry) =>
      mapValues(entry, ({ _ }) => _)
    )
    return { items, next: continuationToken }
  }

  /**
   * Upsert a document
   *
   * @param {Object} data - The data to insert
   * @return {Object} the inserted data
   */
  async insert<T = string|number> (data: AzureDocument<T>): Promise<AzureDocument<T>> {
    validate('O', [data])

    await createTableIfNotExists(this.tableName)
    const existingData = data.RowKey ? await this.findOne(data.RowKey, data.PartitionKey) : {}
    data.RowKey = data.RowKey || uuid()
    await insertOrMergeEntity(this.tableName, {
      ...Object.assign({}, existingData, data),
      PartitionKey: data.PartitionKey || entGen.String('default'),
      RowKey: String(data.RowKey)
    })
    return data
  }

  _buildQuery (queries: {[x: string]: string}, queryString = '', index = 0): azure.TableQuery {
    const keys = Object.keys(queries)
    const current = keys[index]
    const AND = ` ${TableOperators.AND} `
    const EQUAL = QueryComparisons.EQUAL
    const newQueryString = queryString + `${index > 0 ? AND : ''}${current} ${EQUAL} '${queries[current]}'`
    return keys[index + 1] ? this._buildQuery(queries, newQueryString, index + 1) : new azure.TableQuery().where(newQueryString)
  }
}

module.exports = Storage
