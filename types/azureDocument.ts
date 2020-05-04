export interface AzureTableResponses<T = unknown> {
  [x: string]: AzureTableResponse<T>;
}

export interface AzureTableResponse<T = unknown> {
  '_': T;
}

export interface DocumentMap<T = string|number> {
  [key: string]: T;
}

export interface AzureDocumentCommonFields {
  RowKey: string;
  PartitionKey: string;
}

export type AzureDocument<T = string|number> = AzureDocumentCommonFields & DocumentMap<T>;

export interface AzureDocuments {
  items: AzureDocument[];
  next: string|unknown;
}
