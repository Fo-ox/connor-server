export interface DataModel<T> {
    data?: T;
    error?: Error;
}

export interface Error {
    message: string;
}

export interface Token {
    access_token: string;
}
