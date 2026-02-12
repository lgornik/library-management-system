// Core building blocks
export { UniqueId, UUID } from './UniqueId.js';
export { ValueObject, SimpleValueObject } from './ValueObject.js';
export { Entity } from './Entity.js';
export { AggregateRoot, type IAggregateRepository } from './AggregateRoot.js';

// Events
export {
  DomainEvent,
  type EventMetadata,
  type IDomainEventHandler,
  type IDomainEventPublisher,
  type IDomainEventSubscriber,
} from './DomainEvent.js';

// Exceptions
export {
  DomainException,
  EntityNotFoundException,
  BusinessRuleViolationException,
  ValidationException,
  ConcurrencyException,
  UnauthorizedException,
  type ValidationError,
} from './DomainException.js';
