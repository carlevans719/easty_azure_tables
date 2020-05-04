"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var azure_storage_1 = __importDefault(require("azure-storage"));
var mapValues_1 = __importDefault(require("lodash/mapValues"));
var uuid_1 = __importDefault(require("uuid"));
var aproba_1 = __importDefault(require("aproba"));
var util_1 = require("util");
var tableService = azure_storage_1.default.createTableService(process.env.AZURE_STORAGE_ENDPOINT);
var _a = azure_storage_1.default.TableUtilities, entGen = _a.entityGenerator, TableOperators = _a.TableOperators, QueryComparisons = _a.QueryComparisons;
// promisifiy all the things
var createTableIfNotExists = util_1.promisify(tableService.createTableIfNotExists).bind(tableService);
var retrieveEntity = util_1.promisify(tableService.retrieveEntity).bind(tableService);
var insertOrMergeEntity = util_1.promisify(tableService.insertOrMergeEntity).bind(tableService);
var queryEntities = util_1.promisify(tableService.queryEntities).bind(tableService);
/**
 * Table storage module
 *
 * Usage: new Storage(tableName)
 * * e.g.
 * * const pens = new Storage('pens')
 * * const a_pen = await pens.findOne('some-id')
 */
var Storage = /** @class */ (function () {
    function Storage(tableName) {
        this.tableName = tableName;
        aproba_1.default('S', [process.env.AZURE_STORAGE_ENDPOINT]);
        aproba_1.default('S', arguments);
        this.tableName = tableName;
    }
    /**
     * Returns a single document based on provided row key
     *
     * @param {String} rowKey - the row key
     * @param {String} partitionKey - the parition key
     * @return {Object} the document (or null)
     */
    Storage.prototype.findOne = function (rowKey, partitionKey) {
        return __awaiter(this, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        aproba_1.default('SS', [rowKey, partitionKey]);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, createTableIfNotExists(this.tableName)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, retrieveEntity(this.tableName, partitionKey, rowKey)];
                    case 3:
                        data = _a.sent();
                        return [2 /*return*/, mapValues_1.default(data, function (_a) {
                                var _ = _a._;
                                return _;
                            })];
                    case 4:
                        err_1 = _a.sent();
                        console.error(err_1);
                        // don't throw if we can't find anything,
                        // that's not desirable
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns a selection of documents based on a query
     *
     * @param {Object} query - query parameters (e.g. { PartitionKey: '1234', FirstName: 'Gary' })
     * @param {String} continueToken - if you received a 'next' token from the previous query
     * @return {Object} { items: (an array of results), next: a next token if more results are available }
     */
    Storage.prototype.find = function (query, continueToken) {
        return __awaiter(this, void 0, void 0, function () {
            var tableQuery, _a, entries, continuationToken, items;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        aproba_1.default('O|OS', [query, continueToken]);
                        return [4 /*yield*/, createTableIfNotExists(this.tableName)];
                    case 1:
                        _b.sent();
                        tableQuery = this._buildQuery(query);
                        return [4 /*yield*/, queryEntities(this.tableName, tableQuery, continueToken)];
                    case 2:
                        _a = _b.sent(), entries = _a.entries, continuationToken = _a.continuationToken;
                        items = entries.map(function (entry) {
                            return mapValues_1.default(entry, function (_a) {
                                var _ = _a._;
                                return _;
                            });
                        });
                        return [2 /*return*/, { items: items, next: continuationToken }];
                }
            });
        });
    };
    /**
     * Upsert a document
     *
     * @param {Object} data - The data to insert
     * @return {Object} the inserted data
     */
    Storage.prototype.insert = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var existingData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        aproba_1.default('O', [data]);
                        return [4 /*yield*/, createTableIfNotExists(this.tableName)];
                    case 1:
                        _b.sent();
                        if (!data.RowKey) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.findOne(data.RowKey, data.PartitionKey)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = {};
                        _b.label = 4;
                    case 4:
                        existingData = _a;
                        data.RowKey = data.RowKey || uuid_1.default.v4();
                        return [4 /*yield*/, insertOrMergeEntity(this.tableName, __assign(__assign({}, Object.assign({}, existingData, data)), { PartitionKey: data.PartitionKey || entGen.String('default'), RowKey: String(data.RowKey) }))];
                    case 5:
                        _b.sent();
                        return [2 /*return*/, data];
                }
            });
        });
    };
    Storage.prototype._buildQuery = function (queries, queryString, index) {
        if (queryString === void 0) { queryString = ''; }
        if (index === void 0) { index = 0; }
        var keys = Object.keys(queries);
        var current = keys[index];
        var AND = " " + TableOperators.AND + " ";
        var EQUAL = QueryComparisons.EQUAL;
        var newQueryString = queryString + ("" + (index > 0 ? AND : '') + current + " " + EQUAL + " '" + queries[current] + "'");
        return keys[index + 1] ? this._buildQuery(queries, newQueryString, index + 1) : new azure_storage_1.default.TableQuery().where(newQueryString);
    };
    return Storage;
}());
module.exports = Storage;
