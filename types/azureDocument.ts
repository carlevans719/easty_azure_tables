export interface AzureTableResponses {
  [x: string]: AzureTableResponse;
}

export interface AzureTableResponse<T = any> {
  '_': T;
}

export interface AzureDocument {
  RowKey: string;
  PartitionKey: string;
  [x: string]: string|number;
}

export interface AzureDocuments {
  items: AzureDocument[];
  next: string|unknown;
}
