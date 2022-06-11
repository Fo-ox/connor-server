export enum ErrorConstantEnum {
    AUTHORISE_ERROR = 'Login or password entered incorrectly',
    LOGIN_ALREADY_USE = 'This login already in use',
    CREATED_ID_ALREADY_USE = 'The element with the provided id already in use',
    INTEGRATION_ID_ALREADY_USE = 'Task from this integration id already in use',
    FIND_ERROR = 'The element with the provided id was not found',
    UPDATED_ERROR = 'The element with the provided id was not found or could not be updated',
    ERROR_SET_DEFAULT_MODEL = 'Model with the provided id was not found and could not be set',
    EMPTY_DEFAULT_MODEL = 'The system does not have a default model installed'
}
