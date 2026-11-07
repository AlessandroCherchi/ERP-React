// Contract API — Implementation Contract v3.1 §4
// Envelope condiviso client/backend. Nessuna logica: solo tipi.

export interface ApiMeta {
    requestId: string;
    serverVersion?: number;
}

export interface ApiSuccess<T> {
    ok: true;
    data: T;
    meta: ApiMeta;
}

export type ApiErrorCode =
    | 'NETWORK' | 'TIMEOUT' | 'ABORTED'
    | 'AUTH_REQUIRED' | 'FORBIDDEN' | 'TENANT_MISMATCH' | 'VALIDATION'
    | 'CONFLICT' | 'IDEMPOTENCY_REPLAY' | 'IDEMPOTENCY_KEY_REUSE_CONFLICT'
    | 'RATE_LIMITED' | 'SERVER' | 'PROVIDER' | 'PERMANENT';

export interface ApiError {
    ok: false;
    error: {
        code: ApiErrorCode;
        message: string;
        retryable: boolean;
    };
    meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
