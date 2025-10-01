// doc_refs: ["admin/docs/execution-contract.md"]

export type ExecutionIntent = 'dry-run' | 'apply';
export type ExecutionMode = 'append' | 'replace' | 'update';

export interface ExecutionPayload {
  intent: ExecutionIntent;
  documents: string[];
  targetPage?: string;
  targetMode?: ExecutionMode;
  targetFrameName?: string;
}

const isExecutionIntent = (value: unknown): value is ExecutionIntent =>
  value === 'dry-run' || value === 'apply';

const isExecutionMode = (value: unknown): value is ExecutionMode =>
  value === 'append' || value === 'replace' || value === 'update';

const isNonEmptyStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => typeof item === 'string' && item.trim().length > 0);

const sanitizeDocuments = (documents: string[]): string[] => {
  if (!Array.isArray(documents) || !documents.length) {
    throw new Error('ExecutionPayload.documents must be a non-empty array of JSON strings.');
  }

  return documents.map((document, index) => {
    if (typeof document !== 'string') {
      throw new Error(`ExecutionPayload.documents[${index}] must be a JSON string.`);
    }

    const trimmed = document.trim();
    if (!trimmed) {
      throw new Error(`ExecutionPayload.documents[${index}] is empty after trimming.`);
    }

    return trimmed;
  });
};

export const isExecutionPayload = (value: unknown): value is ExecutionPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as ExecutionPayload;

  if (!isExecutionIntent(payload.intent)) {
    return false;
  }

  if (!isNonEmptyStringArray(payload.documents)) {
    return false;
  }

  if (payload.targetPage != null && typeof payload.targetPage !== 'string') {
    return false;
  }

  if (payload.targetFrameName != null && typeof payload.targetFrameName !== 'string') {
    return false;
  }

  if (payload.targetMode != null && !isExecutionMode(payload.targetMode)) {
    return false;
  }

  return true;
};

export const sanitizeExecutionPayload = (payload: ExecutionPayload): ExecutionPayload => {
  const documents = sanitizeDocuments(payload.documents);

  const sanitized: ExecutionPayload = {
    intent: payload.intent,
    documents,
  };

  const trimmedPage = payload.targetPage?.trim();
  if (trimmedPage) {
    sanitized.targetPage = trimmedPage;
  }

  const trimmedFrame = payload.targetFrameName?.trim();
  if (trimmedFrame) {
    sanitized.targetFrameName = trimmedFrame;
  }

  if (payload.targetMode) {
    if (!isExecutionMode(payload.targetMode)) {
      throw new Error('ExecutionPayload.targetMode has an invalid value.');
    }
    sanitized.targetMode = payload.targetMode;
  }

  return sanitized;
};
