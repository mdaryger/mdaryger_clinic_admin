# Firestore Indexes

Ниже перечислены обязательные индексы для корректной работы запросов в Firestore.

## Обязательные индексы

### `cities`

- `countryId` ASC
- `isActive` ASC
- `name.en` ASC

### `clinics`

- `cityId` ASC
- `isActive` ASC
- `name` ASC

### `clinic_branches`

- `clinicId` ASC
- `isActive` ASC
- `name` ASC

### `home_visit_requests`

- `clinicId` ASC
- `createdAt` DESC

### `clinic_visit_requests`

- `clinicId` ASC
- `createdAt` DESC

### `home_visit_requests_plan`

- `clinicId` ASC
- `createdAt` DESC

### `doctors`

- `clinicId` ASC

### `doctors`

- `clinicBranchId` ASC

### `clinic_admin`

- `clinicId` ASC

### `clinic_branch_admin`

- `clinicId` ASC

## Если Firebase показывает `index error`

Если Firestore выдаст ошибку о недостающем индексе, нужно открыть ссылку из сообщения об ошибке в консоли Firebase или браузере, затем создать индекс по этой ссылке.

Обычно Firebase сам подставляет нужную конфигурацию индекса, поэтому достаточно подтвердить создание.
