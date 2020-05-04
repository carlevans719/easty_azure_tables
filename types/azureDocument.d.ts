interface AzureTableResponses {
  [x: string]: AzureTableResponse;
}

interface AzureTableResponse {
  '_': any;
}

interface AzureDocument {
  RowKey: string;
  PartitionKey: string;
  [x: string]: string|number;
}

interface AzureDocuments {
  items: AzureDocument[];
  next: string|unknown;
}
