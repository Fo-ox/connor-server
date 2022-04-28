export interface DataModel<T> {
    data?: T;
    error?: Error;
}

export interface Error {
    message: string;
}
