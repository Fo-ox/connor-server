#System Models
___

###[T02] - TaskDto
| Ключ                 | Тип       | Описание                                                          | Пример данных                                |
|----------------------|-----------|-------------------------------------------------------------------|----------------------------------------------|
| **id**               | `string`  | UUID Первичный ключ                                               | 149f9199-4139-443a-a940-a66d5f032996         |
| **internalSystemId** | `string`  | ID сущности при интеграции                                        | CLOUDCRM-118613                              |
| **name**             | `string`  | Имя задачи                                                        | [CPM UI] Create ticket for discount override |
| **description**      | `string`  | Описание задачи                                                   | Some description task value                  |
| **projectId**        | `string`  | ID Проекта задачи                                                 | CON                                          |
| **statusId**         | `string`  | ID Статуса задачи                                                 | 10001                                        |
| **completed**        | `boolean` | Флаг перевода задачи в финальный статус                           | true                                         |
| **typeId**           | `string`  | ID Типа задачи                                                    | 10000                                        |
| **priorityId**       | `string`  | ID Приоритета задачи                                              | 3                                            |
| **tags**             | `string`  | Список ключевых условий и этапов выполнения задачи                | Integration, New, Update, Deploy, Refactor   |
| **reporterId**       | `string`  | ID Инициатора задачи                                              | 97296e53-7373-49c6-985d-27c0055d7bbd         |
| **assigneeId**       | `string`  | ID Исполнителя задачи                                             | 7dc8c306-d8c1-4049-ae1b-4e5e155283bd         |
| **createDate**       | `string`  | Дата и время создания задачи                                      | 2022-05-15T14:54:49.136+0300                 |
| **closeDate**        | `string`  | Дата и время перевода задачи в финальный статус                   | 2022-05-15T14:54:49.136+0300                 |
| **initialEstimate**  | `string`  | Верхнеуровневая оценка сложности задачи                           | Hard                                         |
| **predictEstimate**  | `number`  | Предсказанная оценка времени разрабатываемой задачи в часах       | 40                                           |
| **resolvedEstimate** | `number`  | Оценка реального количества времени затраченого на задачу в часах | 35                                           |
| **predictorVersion** | `string`  | Версия обученного машинного алгоритма, используемая при расчете   | 1                                            |
| **predictorType**    | `string`  | Тип используемого машинного алгоритма                             | randomForest                                 |
