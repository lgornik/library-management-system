# 📚 Library Management System

> Personal library management system built with Event-Driven Clean Architecture, DDD, CQRS, and Microservices.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview

A comprehensive project for practicing advanced software architecture patterns:

- **Domain-Driven Design (DDD)** - Aggregates, Entities, Value Objects, Domain Events
- **CQRS** - Command Query Responsibility Segregation
- **Event-Driven Architecture** - RabbitMQ event bus
- **Microservices** - Independent services communicating via gRPC
- **Clean Architecture** - Layered, testable, maintainable code

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTS                                 │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  React Web   │  │ React Native │                         │
│  └──────────────┘  └──────────────┘                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GraphQL API Gateway (Apollo)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ gRPC
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Book Service│  │Author Service│  │Stats Service│
│             │  │             │  │             │
│ PostgreSQL  │  │ PostgreSQL  │  │ PostgreSQL  │
│ (Write)     │  │ (Write)     │  │ (Write)     │
│             │  │             │  │             │
│ MongoDB     │  │ MongoDB     │  │ MongoDB     │
│ (Read)      │  │ (Read)      │  │ (Read)      │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌─────────────────┐
              │    RabbitMQ     │
              │   (Event Bus)   │
              └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Docker** & Docker Compose

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/library-management-system.git
cd library-management-system

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env

# 4. Start infrastructure (PostgreSQL, MongoDB, Redis, RabbitMQ)
pnpm docker:up

# 5. Build all packages
pnpm build

# 6. Start development servers
pnpm dev
```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages |
| `pnpm dev` | Start development servers |
| `pnpm test` | Run all tests |
| `pnpm lint` | Run linter |
| `pnpm type-check` | TypeScript type checking |
| `pnpm docker:up` | Start Docker services |
| `pnpm docker:down` | Stop Docker services |
| `pnpm docker:logs` | View Docker logs |

## 📁 Project Structure

```
library-management-system/
├── apps/                          # Applications
│   ├── api-gateway/               # GraphQL Gateway (Apollo)
│   ├── web-client/                # React Web App
│   └── mobile-client/             # React Native App
│
├── services/                      # Microservices
│   ├── book-service/              # Book management
│   ├── author-service/            # Author management
│   ├── reading-stats-service/     # Statistics & analytics
│   └── notification-service/      # Notifications
│
├── packages/                      # Shared packages
│   ├── shared-kernel/             # DDD building blocks
│   ├── eslint-config/             # ESLint configuration
│   └── tsconfig/                  # TypeScript configs
│
└── infrastructure/                # DevOps
    ├── docker/                    # Docker Compose
    ├── kubernetes/                # K8s manifests
    └── terraform/                 # AWS Infrastructure
```

## 🧱 Shared Kernel

The `@library/shared-kernel` package provides base classes for DDD and CQRS:

### Domain Building Blocks

```typescript
import { 
  AggregateRoot, 
  Entity, 
  ValueObject, 
  DomainEvent,
  UniqueId 
} from '@library/shared-kernel';

// Create a custom ID
class BookId extends UniqueId {
  static generate(): BookId {
    return new BookId(UniqueId.generateUUID());
  }
}

// Create a Value Object
class ISBN extends SimpleValueObject<string> {
  static create(value: string): ISBN {
    if (!this.isValid(value)) {
      throw new DomainException('Invalid ISBN');
    }
    return new ISBN(value);
  }
}

// Create an Aggregate Root
class Book extends AggregateRoot<BookId> {
  static create(props: CreateBookProps): Book {
    const book = new Book(BookId.generate(), props);
    book.addDomainEvent(new BookCreatedEvent({ ... }));
    return book;
  }
}
```

### CQRS

```typescript
import { 
  Command, 
  Query, 
  ICommandHandler, 
  IQueryHandler 
} from '@library/shared-kernel';

// Command
class CreateBookCommand extends Command<CreateBookPayload> {
  constructor(payload: CreateBookPayload) {
    super(payload);
  }
}

// Command Handler
class CreateBookHandler implements ICommandHandler<CreateBookCommand, string> {
  async execute(command: CreateBookCommand): Promise<string> {
    const book = Book.create(command.payload);
    await this.repository.save(book);
    return book.id.value;
  }
}

// Query
class GetBooksByYearQuery extends Query<{ year: number }> {
  constructor(year: number) {
    super({ year });
  }
}
```

## 🐳 Docker Services

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | `localhost:5432` |
| MongoDB | 27017 | `localhost:27017` |
| Redis | 6379 | `localhost:6379` |
| RabbitMQ | 5672 / 15672 | `localhost:15672` (UI) |
| Adminer | 8080 | `localhost:8080` |
| Mongo Express | 8081 | `localhost:8081` |

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | postgres | postgres |
| MongoDB | mongo | mongo |
| RabbitMQ | rabbit | rabbit |
| Adminer | - | - |
| Mongo Express | admin | admin |

## 📋 Development Roadmap

- [x] **Phase 1**: Monorepo setup & shared-kernel
- [ ] **Phase 2**: Book Service (domain, CQRS, persistence)
- [ ] **Phase 3**: Author Service
- [ ] **Phase 4**: Event Bus integration
- [ ] **Phase 5**: gRPC communication
- [ ] **Phase 6**: GraphQL API Gateway
- [ ] **Phase 7**: React Web Client
- [ ] **Phase 8**: React Native Mobile App
- [ ] **Phase 9**: Kubernetes & AWS deployment

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run tests with coverage
pnpm test:coverage
```

## 📚 Resources

- [Domain-Driven Design](https://www.domainlanguage.com/ddd/) - Eric Evans
- [Implementing DDD](https://vaughnvernon.com/) - Vaughn Vernon
- [CQRS Journey](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

## 📄 License

MIT © Your Name

---

**Happy coding! 🚀**
