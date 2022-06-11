export class ModelDto {
    id: string;
    version: number;
    type: string;
    datasetContract?: string[];
    modelInstance?: any;
}

export enum ModelTypesEnum {
    RANDOM_FOREST = 'randomForest',
    LINEAR_REGRESSION = 'linearRegression'
}
