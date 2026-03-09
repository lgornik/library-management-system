# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Build & Development Commands

This is a pnpm + Turborepo monorepo. All root commands delegate to Turbo:

```
pnpm install          # Install all dependencies
pnpm build            # Build all packages (shared-kernel must build first; Turbo handles ordering)
pnpm dev              # Start dev servers (all services, with watch mode)
pnpm lint             # Lint all packages
pnpm lint:fix         # Lint with auto-fix
pnpm type-check       # TypeScript type checking across all packages
pnpm format           # Prettier formatting
```

### Testing

Test runner is **Vitest** (not Jest). Each package has its own `vitest.config.ts`.

```
pnpm test                 # Run all tests (via Turbo)
pnpm test:unit            # Run unit tests only
pnpm test:integration     # Run integration tests only
pnpm test:coverage        # Run tests with v8 coverage
```

To run a single test file within a package, use the package-level script directly:

```
pnpm --filter @library/shared-kernel test -- tests/ValueObject.test.ts
pnpm --filter @library/book-service test -- tests/unit/SomeTest.test.ts
```

Vitest is configured with `globals: true` (no explicit imports of `describe`/`it`/`expect` needed).

### Infrastructure

Docker Compose manages local dev dependencies (PostgreSQL, MongoDB, Redis, RabbitMQ):

```
pnpm docker:up       # Start infrastructure containers
pnpm docker:down     # Stop containers
pnpm docker:logs     # Tail container logs
```

**Note:** Docker Compose maps PostgreSQL to port **5435** (not 5432) on the host.

### Database

Book service database migrations: `pnpm --filter @library/book-service db:migrate`

## Architecture

This is a DDD/CQRS/Event-Driven microservices system. Currently only Phase 1 (shared-kernel) and Phase 2 (book-service) are implemented; other services (author, stats, notification, API gateway, clients) are planned but not yet built.

### Monorepo Structure

- `packages/shared-kernel` (`@library/shared-kernel`) — DDD and CQRS base classes used by all services
- `services/book-service` (`@library/book-service`) — First microservice, fully implemented
- `infrastructure/docker/` — Docker Compose for local dev environment

### Shared Kernel (`@library/shared-kernel`)

Provides the foundational building blocks that all services extend:

- **Domain primitives:** `AggregateRoot`, `Entity`, `ValueObject`, `SimpleValueObject`, `UniqueId`, `DomainEvent`, `DomainException` (and specialized exception types)
- **CQRS:** `Command`, `Query`, `ICommandHandler`, `IQueryHandler`, `InMemoryCommandBus`, `InMemoryQueryBus`, `CQRSBus`
- **Interfaces:** `IAggregateRepository`, `IDomainEventPublisher`, `IDomainEventSubscriber`

The package exports three subpaths: `@library/shared-kernel`, `@library/shared-kernel/domain`, `@library/shared-kernel/cqrs`.

### Service Internal Architecture (Clean Architecture Layers)

Each service follows the same layered structure. Using book-service as the reference:

**`domain/`** — Pure domain logic, no infrastructure dependencies
- `aggregates/` — Aggregate roots (e.g., `Book`). Created via static `create()` factory; reconstituted from persistence via `reconstitute()` (which does NOT emit events).
- `entities/` — Child entities within aggregates (e.g., `Quote`, `Note`)
- `value-objects/` — Validated, immutable wrappers (e.g., `ISBN`, `Title`, `PageCount`, `Rating`, `ReadingStatus`, `BookId`)
- `events/` — Domain event classes. Event names follow `library.<service>.<action>` convention (e.g., `library.book.created`)
- `repositories/` — Repository interfaces (domain contracts, not implementations)

**`application/`** — Use cases orchestrating domain logic
- `commands/` — Command objects (imperative: `CreateBookCommand`, `DeleteBookCommand`, etc.)
- `queries/` — Query objects
- `handlers/` — Command/query handlers. Each handler receives a repository + event publisher via constructor injection. Pattern: create/load aggregate → execute domain logic → persist → publish events → clear events.
- `dtos/` — Data transfer objects for read-side queries

**`infrastructure/`** — External concerns
- `persistence/write/` — PostgreSQL repository implementations (write model). Uses `pg` with raw SQL queries and transactions. Implements optimistic concurrency via version column.
- `persistence/read/` — MongoDB read repositories returning DTOs directly. Optimized for queries, never modifies data directly (updated via projections).
- `messaging/` — RabbitMQ event publishing and subscription. Uses topic exchange (`library.events`). Projections (`BookProjections`) consume events and update the MongoDB read model.
- `config/` — Zod-validated environment configuration

### CQRS Data Flow

1. **Write path:** Command → CommandHandler → AggregateRoot (domain logic + validation) → PostgreSQL (write model) → RabbitMQ (domain events)
2. **Read path:** Query → ReadRepository → MongoDB (read model, denormalized documents)
3. **Projection sync:** RabbitMQ events → BookProjections → MongoDB updates (eventual consistency)

### Key Patterns to Follow

- Aggregates enforce all invariants. All modifications go through the aggregate root.
- Value objects validate on creation (`create()` factory methods with validation, `fromString()`/`fromNumber()` for reconstitution without re-validation).
- Domain events are immutable (frozen via `Object.freeze`). They carry correlation/causation IDs for tracing.
- Command handlers are registered on the in-memory bus by name (`commandBus.register(CreateBookCommand, handler)`).
- Repository `save()` handles both insert and update (upsert pattern).
- Configuration uses Zod schemas parsed from environment variables.

### TypeScript Configuration

- Target: ES2022, Module: NodeNext
- Strict mode enabled with `noUncheckedIndexedAccess`
- ESM modules (all packages use `"type": "module"`, imports require `.js` extensions)
- Decorators enabled (`emitDecoratorMetadata`, `experimentalDecorators`)

### Code Style

- Prettier: single quotes, semicolons, trailing commas (`es5`), 100 char print width, LF line endings
- Lint-staged runs ESLint + Prettier on `.ts`/`.tsx` files on commit
