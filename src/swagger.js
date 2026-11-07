/** OpenAPI 3.0 — документация БазМет API (работы 7–8). */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "БазМет API",
    version: "1.0.0",
    description:
      "REST API каталога метизов и заявок. Хранение: PostgreSQL (bazmet + bazmet_orders). " +
      "Swagger UI: /api/docs — альтернатива Postman."
  },
  servers: [{ url: "http://127.0.0.1:3001", description: "Локальный сервер" }],
  tags: [
    { name: "Health", description: "Проверка API и БД" },
    { name: "Catalog", description: "Каталог изделий и категорий" },
    { name: "Orders", description: "Заявки клиентов" }
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Состояние API",
        responses: {
          200: {
            description: "Сервис доступен",
            content: {
              "application/json": {
                example: {
                  ok: true,
                  service: "bazmet-api",
                  storage: "postgresql",
                  databases: { catalog: "bazmet", orders: "bazmet_orders" }
                }
              }
            }
          }
        }
      }
    },
    "/api/categories": {
      get: {
        tags: ["Catalog"],
        summary: "Список категорий",
        responses: {
          200: {
            description: "Категории каталога",
            content: {
              "application/json": {
                example: [
                  { id: "nut", title: "Гайки", img: "/images/nuts.jpg", path: "/catalog/nuts" },
                  { id: "bolt", title: "Болты", img: "/images/bolts.jpg", path: "/catalog/bolts" }
                ]
              }
            }
          }
        }
      }
    },
    "/api/products": {
      get: {
        tags: ["Catalog"],
        summary: "Список изделий",
        description: "Фильтры: type, standard, material, coating, q. Формат ответа: ",
        parameters: [,
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
              enum: ["nut", "bolt", "screw", "rivet", "washer"]
            },
            description: "Тип метиза: nut=Гайки, bolt=Болты, screw=Винты, rivet=Заклёпки, washer=Шайбы",
            example: "nut"
          },
          {
            name: "standard",
            in: "query",
            schema: {
              type: "string",
              enum: ["gost", "ost", "normal"]
            },
            description: "Стандарт: gost=ГОСТ, ost=ОСТ, normal=Нормаль",
            example: "gost"
          },
          {
            name: "material",
            in: "query",
            schema: {
              type: "string",
              enum: ["steel", "30hgsa", "stainless", "brass", "aluminum", "copper"]
            },
            description:
              "Материал: steel=Сталь, 30hgsa=Сталь 30ХГСА, stainless=коррозионно-стойкая, brass=Латунь, aluminum=Алюминий, copper=Медь",
            example: "steel"
          },
          {
            name: "coating",
            in: "query",
            schema: {
              type: "string",
              enum: ["zinc", "cadmium", "oxide", "anodizing", "copper", "none"]
            },
            description:
              "Покрытие: zinc=Цинковое, cadmium=Кадмиевое, oxide=Хим.Окс, anodizing=Ан.Окс, copper=Медное, none=без покрытия",
            example: "zinc"
          },
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Поиск по названию / ключевым словам (например 5915, болт, ОСТ)",
            example: "5915"
          }
        ],
        responses: {
          200: {
            description: "Список изделий",
            content: {
              "application/json": {
                example: {
                  count: 1,
                  items: [
                    {
                      id: "nut-gost-5915",
                      title: "Гайка ГОСТ 5915-70 (шестигранная класса В)",
                      type: "nut",
                      standard: "gost",
                      img: "/images/nut-gost-5915.jpg"
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/api/products/{id}": {
      get: {
        tags: ["Catalog"],
        summary: "Одно изделие по id (SKU)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: ["bolt-gost-7798", "bolt-ost-31115", "bolt-normal", "screw-gost-1491", "screw-ost-31528", "screw-normal", "nut-gost-5915", "nut-ost-33055", "nut-normal", "rivet-gost-10299", "rivet-ost-34040", "rivet-normal", "washer-normal", "washer-ost-11532", "washer-gost-11371"]
            },
            description: "SKU изделия из каталога (выбери из списка)",
            example: "nut-gost-5915"
          }
        ],
        responses: {
          200: {
            description: "Карточка изделия",
            content: {
              "application/json": {
                example: {
                  id: "nut-gost-5915",
                  title: "Гайка ГОСТ 5915-70 (шестигранная класса В)",
                  type: "nut",
                  standard: "gost"
                }
              }
            }
          },
          404: {
            description: "Не найдено",
            content: {
              "application/json": {
                example: { error: "Изделие не найдено" }
              }
            }
          }
        }
      }
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "Список заявок",
        responses: {
          200: {
            description: "Заявки из bazmet_orders"
          }
        }
      },
      post: {
        tags: ["Orders"],
        summary: "Создать заявку",
        description:
          "Обязательны name, phone, email. service — изделие или услуга. description — комментарий / размер.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "phone", "email"],
                properties: {
                  service: { type: "string" },
                  name: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  description: { type: "string" }
                }
              },
              examples: {
                productOrder: {
                  summary: "Заявка на изделие",
                  value: {
                    service: "Болт ГОСТ 7798-70 (шестигранный общего назначения)",
                    name: "Иван Иванов",
                    phone: "+7 (900) 111-22-33",
                    email: "ivan@mail.ru",
                    description: "Материал: Сталь 10; Диаметр: M10; Длина: 40; Покрытие: Ц (цинковое)"
                  }
                },
                serviceOrder: {
                  summary: "Заявка на услугу",
                  value: {
                    service: "Пескоструйка",
                    name: "ООО Металл",
                    phone: "+7 (900) 222-33-44",
                    email: "zakaz@metal.ru",
                    description: "Партия 500 шт, очистка перед цинкованием"
                  }
                },
                shortOrder: {
                  summary: "Минимальная заявка",
                  value: {
                    name: "Пётр",
                    phone: "+79001234567",
                    email: "petr@example.com",
                    service: "",
                    description: "Нужен прайс по гайкам ГОСТ"
                  }
                }
              }
            },
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["name", "phone", "email"],
                properties: {
                  service: { type: "string" },
                  name: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  description: { type: "string" }
                }
              },
              example: {
                service: "Гайка ГОСТ 5915-70",
                name: "Иван",
                phone: "+79001112233",
                email: "ivan@mail.ru",
                description: "M8, цинк"
              }
            }
          }
        },
        responses: {
          201: {
            description: "Заявка создана"
          },
          400: {
            description: "Не хватает обязательных полей",
            content: {
              "application/json": {
                example: { error: "Укажите имя, телефон и e-mail" }
              }
            }
          }
        }
      }
    }
  }
};
