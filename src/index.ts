import azure from 'azure-storage'
import mapValues from 'lodash/mapValues'
import uuid from 'uuid'
import validate from 'aproba'
import { promisify } from 'util'

const tableService: azure.TableService = azure.createTableService(process.env.AZURE_STORAGE_ENDPOINT)
const { entityGenerator: entGen, TableOperators, QueryComparisons } = azure.TableUtilities

// promisifiy all the things
const createTableIfNotExists = promisify(tableService.createTableIfNotExists).bind(tableService)
const retrieveEntity = promisify(tableService.retrieveEntity).bind(tableService)
const insertOrMergeEntity = promisify(tableService.insertOrMergeEntity).bind(tableService)
const queryEntities = promisify(tableService.queryEntities).bind(tableService)

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
   * @param {String} rowKey - the row key
   * @param {String} partitionKey - the parition key
   * @return {Object} the document (or null)
   */
  async findOne (rowKey: string, partitionKey: string): Promise<AzureDocument|unknown> {
    validate('SS', [rowKey, partitionKey])
    try {
      await createTableIfNotExists(this.tableName)
      const data: AzureTableResponses = await retrieveEntity(this.tableName, partitionKey, rowKey)
      return mapValues(data, ({ _ }: AzureTableResponse) => _)
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
   * @param {String} continueToken - if you received a 'next' token from the previous query
   * @return {Object} { items: (an array of results), next: a next token if more results are available }
   */
  async find (query: {[x: string]: string}, continueToken: azure.TableService.TableContinuationToken): Promise<AzureDocuments> {
    validate('O|OS', [query, continueToken])
    await createTableIfNotExists(this.tableName)
    const tableQuery = this._buildQuery(query)
    const { entries, continuationToken } = await queryEntities(this.tableName, tableQuery, continueToken)
    const items = entries.map((entry?: AzureTableResponses) =>
      mapValues(entry, ({ _ }: AzureTableResponse) => _
      ))
    return { items, next: continuationToken }
  }

  /**
   * Upsert a document
   *
   * @param {Object} data - The data to insert
   * @return {Object} the inserted data
   */
  async insert (data: AzureDocument): Promise<AzureDocument> {
    validate('O', [data])
    await createTableIfNotExists(this.tableName)
    const existingData = data.RowKey ? await this.findOne(data.RowKey, data.PartitionKey) : {}
    data.RowKey = data.RowKey || uuid.v4()
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
